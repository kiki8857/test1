import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';

// 插件名称常量
const pluginName = 'test-main';

// 初始化插件设置
if (!extension_settings[pluginName]) {
  extension_settings[pluginName] = {
    enabled: true,
  };
}

// 等待jQuery和DOM完全加载
$(document).ready(function () {
  console.log('[test-main] Document ready, initializing plugin...');

  // Function to add the log button to a message element
  function addLogButton(messageElement, mes) {
    // Skip if plugin disabled or message invalid
    if (!extension_settings[pluginName].enabled || !mes || !mes.mesid) return;

    // Find the area where message action buttons usually go
    const buttonsContainer = $(messageElement).find('.mes_buttons');

    // Only proceed if the container exists and our button isn't already there
    if (buttonsContainer.length > 0 && buttonsContainer.find('.test-main-log-button').length === 0) {
      const button = $('<button></button>')
        .text('Log')
        .addClass('test-main-log-button fa-button')
        .on('click', function (event) {
          event.stopPropagation(); // Prevent potential parent handlers
          console.log('[test-main] Message Text:', mes.mes);
          console.log('[test-main] Message Object:', mes);

          // 使用 try/catch 包装 toastr 调用，以防它未定义
          try {
            if (typeof toastr !== 'undefined') {
              toastr.info(`Message logged to console (ID: ${mes.mesid})`);
            } else {
              console.log('[test-main] Toastr not available for notification');
            }
          } catch (error) {
            console.error('[test-main] Error showing notification:', error);
          }
        });

      // Prepend the button to the container
      buttonsContainer.prepend(button);
      console.log('[test-main] Button added to message:', mes.mesid);
    } else if (buttonsContainer.length === 0) {
      // Fallback or logging if the expected container isn't found
      console.warn('[test-main] Could not find .mes_buttons container for message:', mes.mesid);
    }
  }

  // Listen for when a new message is added to the chat DOM
  eventSource.on(event_types.MESSAGE_ADDED, (mes, messageElement) => {
    if (!extension_settings[pluginName].enabled) return;

    console.log('[test-main] MESSAGE_ADDED event triggered for message:', mes?.mesid || 'unknown');

    // Wait a moment for the message element to be fully rendered, especially buttons
    setTimeout(() => {
      try {
        addLogButton(messageElement, mes);
      } catch (error) {
        console.error('[test-main] Error adding button in MESSAGE_ADDED event:', error);
      }
    }, 100); // Small delay might help ensure .mes_buttons is ready
  });

  // Handle chat updates too, to reapply buttons after message changes
  eventSource.on(event_types.CHAT_UPDATED, () => {
    if (!extension_settings[pluginName].enabled) return;

    console.log('[test-main] CHAT_UPDATED event triggered, checking messages for log buttons.');
    setTimeout(() => {
      try {
        $('.mes').each(function () {
          const messageElement = this;
          const messageId = $(messageElement).attr('mesid');
          if (messageId) {
            try {
              const context = getContext();
              if (context && context.chat && Array.isArray(context.chat)) {
                const message = context.chat.find(m => m.mesid === messageId);
                if (message) {
                  addLogButton(messageElement, message);
                }
              }
            } catch (error) {
              console.error('[test-main] Error processing message:', messageId, error);
            }
          }
        });
      } catch (error) {
        console.error('[test-main] Error in CHAT_UPDATED event handler:', error);
      }
    }, 100);
  });

  // 添加设置 UI
  function createSettings() {
    // 检查设置面板是否已存在，避免重复添加
    if ($('#test-main-settings').length > 0) {
      console.log('[test-main] Settings UI already exists, skipping creation');
      return;
    }

    const settingsHtml = `
      <div id="test-main-settings" class="test-main-container">
          <div class="inline-drawer">
              <div class="inline-drawer-toggle inline-drawer-header">
                  <b>Test Plugin</b>
                  <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
              </div>
              <div class="inline-drawer-content">
                  <div class="test-main-section">
                      <div class="test-main-toggle-row">
                          <span class="test-main-label">插件状态:</span>
                          <select id="test-main-toggle">
                              <option value="enabled">开启</option>
                              <option value="disabled">关闭</option>
                          </select>
                      </div>
                  </div>
                  <hr class="sysHR">
              </div>
          </div>
      </div>`;

    // 将UI添加到SillyTavern扩展设置区域
    $('#extensions_settings').append(settingsHtml);

    // 设置事件监听器
    $('#test-main-toggle').on('change', function () {
      extension_settings[pluginName].enabled = $(this).val() === 'enabled';
      console.log(`[test-main] Plugin ${extension_settings[pluginName].enabled ? 'enabled' : 'disabled'}`);

      // 保存设置到SillyTavern配置
      saveSettingsDebounced();

      // 如果禁用，移除已添加的按钮
      if (!extension_settings[pluginName].enabled) {
        $('.test-main-log-button').remove();
        console.log('[test-main] Removed all log buttons due to plugin being disabled');
      } else {
        // 如果启用，重新添加按钮
        addButtonsToExistingMessages();
      }
    });

    // 设置初始值
    $('#test-main-toggle').val(extension_settings[pluginName].enabled ? 'enabled' : 'disabled');

    // 初始化抽屉行为
    initializeDrawer();
  }

  // 初始化抽屉展开/收起功能 - 常见于SillyTavern设置面板
  function initializeDrawer() {
    $('#test-main-settings .inline-drawer-toggle').on('click', function () {
      const icon = $(this).find('.inline-drawer-icon');
      const content = $(this).next('.inline-drawer-content');

      if (content.is(':visible')) {
        icon.removeClass('fa-circle-chevron-up').addClass('fa-circle-chevron-down');
        content.slideUp(200);
      } else {
        icon.removeClass('fa-circle-chevron-down').addClass('fa-circle-chevron-up');
        content.slideDown(200);
      }
    });
  }

  // 在页面初始加载时添加按钮到已有消息
  function addButtonsToExistingMessages() {
    if (!extension_settings[pluginName].enabled) return;

    console.log('[test-main] Checking for existing messages...');
    try {
      const context = getContext();
      if (!context || !context.chat || !Array.isArray(context.chat)) {
        console.warn('[test-main] No valid chat context available');
        return;
      }

      $('.mes').each(function () {
        const messageElement = this;
        const messageId = $(messageElement).attr('mesid');
        if (messageId) {
          const message = context.chat.find(m => m.mesid === messageId);
          if (message) {
            addLogButton(messageElement, message);
          }
        }
      });
    } catch (error) {
      console.error('[test-main] Error adding buttons to existing messages:', error);
    }
  }

  // 扩展加载事件
  eventSource.on(event_types.EXTENSIONS_FIRST_LOAD, () => {
    console.log('[test-main] EXTENSIONS_FIRST_LOAD event triggered');
    try {
      createSettings();
      console.log('[test-main] Plugin loaded successfully. Settings UI created.');
    } catch (error) {
      console.error('[test-main] Error during EXTENSIONS_FIRST_LOAD handling:', error);
    }
  });

  // 扩展设置加载后事件 - 这是一个更可靠的点来添加UI元素
  eventSource.on(event_types.SETTINGS_LOADED, () => {
    console.log('[test-main] SETTINGS_LOADED event triggered');
    try {
      // 调用一次，确保设置正确加载
      createSettings();
    } catch (error) {
      console.error('[test-main] Error during SETTINGS_LOADED handling:', error);
    }
  });

  // 角色选择变化事件 - 当切换角色时，确保为新的消息添加按钮
  eventSource.on(event_types.CHARACTER_SELECTED, () => {
    console.log('[test-main] CHARACTER_SELECTED event triggered');
    setTimeout(() => {
      try {
        addButtonsToExistingMessages();
      } catch (error) {
        console.error('[test-main] Error during CHARACTER_SELECTED handling:', error);
      }
    }, 500);
  });

  // 聊天加载后执行 - 添加按钮到所有现有消息
  eventSource.on(event_types.CHAT_CHANGED, chatId => {
    console.log('[test-main] CHAT_CHANGED event triggered, chatId:', chatId);
    setTimeout(() => {
      try {
        addButtonsToExistingMessages();
      } catch (error) {
        console.error('[test-main] Error during CHAT_CHANGED handling:', error);
      }
    }, 500);
  });

  // 尝试立即为现有消息添加按钮
  setTimeout(addButtonsToExistingMessages, 1000);
});

console.log('[test-main] Plugin initialized. Waiting for document ready...');
