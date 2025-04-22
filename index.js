import { eventSource, event_types } from '../../../script.js';
import { extension_settings, getContext } from '../../extensions.js';

// 插件名称常量
const pluginName = 'test-main';

// 初始化插件设置
if (!extension_settings[pluginName]) {
  extension_settings[pluginName] = {
    enabled: true,
  };
}

// Function to add the log button to a message element
function addLogButton(messageElement, mes) {
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
        toastr.info(`Message logged to console (ID: ${mes.mesid})`); // Provide visual feedback
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
  console.log('[test-main] MESSAGE_ADDED event triggered for message:', mes.mesid);

  // Wait a moment for the message element to be fully rendered, especially buttons
  setTimeout(() => {
    addLogButton(messageElement, mes);
  }, 100); // Small delay might help ensure .mes_buttons is ready
});

// Handle chat updates too, to reapply buttons after message changes
eventSource.on(event_types.CHAT_UPDATED, () => {
  if (!extension_settings[pluginName].enabled) return;

  console.log('[test-main] CHAT_UPDATED event triggered, checking messages for log buttons.');
  setTimeout(() => {
    $('.mes').each(function () {
      const messageElement = this;
      const messageId = $(messageElement).attr('mesid');
      if (messageId) {
        try {
          const context = getContext();
          const message = context.chat.find(m => m.mesid === messageId);
          if (message) {
            addLogButton(messageElement, message);
          }
        } catch (error) {
          console.error('[test-main] Error processing message:', messageId, error);
        }
      }
    });
  }, 100);
});

// 添加设置 UI
function createSettings() {
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
  });

  // 设置初始值
  $('#test-main-toggle').val(extension_settings[pluginName].enabled ? 'enabled' : 'disabled');
}

// 在页面初始加载时添加按钮到已有消息
function addButtonsToExistingMessages() {
  console.log('[test-main] Checking for existing messages...');
  try {
    const context = getContext();
    if (!context || !context.chat) {
      console.warn('[test-main] No chat context available');
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
  createSettings();
  console.log('[test-main] Plugin loaded successfully. Settings UI created.');
});

// 扩展设置加载后事件 - 这是一个更可靠的点来添加UI元素
eventSource.on(event_types.SETTINGS_LOADED, () => {
  console.log('[test-main] SETTINGS_LOADED event triggered');
  // 调用一次，确保设置正确加载
  if ($('#test-main-settings').length === 0) {
    createSettings();
  }
});

// 角色选择变化事件 - 当切换角色时，确保为新的消息添加按钮
eventSource.on(event_types.CHARACTER_SELECTED, () => {
  console.log('[test-main] CHARACTER_SELECTED event triggered');
  setTimeout(addButtonsToExistingMessages, 500);
});

// 聊天加载后执行 - 添加按钮到所有现有消息
eventSource.on(event_types.CHAT_CHANGED, chatId => {
  console.log('[test-main] CHAT_CHANGED event triggered, chatId:', chatId);
  setTimeout(addButtonsToExistingMessages, 500);
});

console.log('[test-main] Plugin initialized with enhanced logging and jQuery selectors.');
