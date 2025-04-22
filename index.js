import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { getContext } from '../../../../scripts/st-context.js';
import { extension_settings } from '../../../extensions.js';

// 插件名称常量
const pluginName = 'test-main';

// 初始化插件设置
if (!extension_settings[pluginName]) {
  extension_settings[pluginName] = {
    enabled: true,
    forceButtons: true, // 新增：强制添加按钮，即使没有匹配的消息数据
  };
}

// 调试模式 - 输出详细日志
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[test-main] DEBUG:', ...args);
  }
}

// 等待jQuery和DOM完全加载
$(document).ready(function () {
  console.log('[test-main] Document ready, initializing plugin...');

  // Function to add the log button to a message element - 即使没有消息数据也能添加按钮
  function addButtonForce(messageElement) {
    // 从DOM中提取消息文本（没有消息对象时的备用方案）
    const messageTextEl = $(messageElement).find('.mes_text');
    const messageText = messageTextEl.length > 0 ? messageTextEl.text().trim() : '未找到消息文本';
    const messageId = $(messageElement).attr('mesid') || '未知ID';

    debugLog(`强制为消息元素添加按钮，提取的文本: ${messageText.substring(0, 30)}...`);

    // 检查元素是否已经有按钮
    if ($(messageElement).find('.test-main-log-button').length > 0) {
      debugLog(`消息元素已有按钮，跳过`);
      return;
    }

    // 尝试添加到.mes_buttons
    const buttonsContainer = $(messageElement).find('.mes_buttons');
    if (buttonsContainer.length > 0) {
      debugLog(`找到 .mes_buttons 容器`);

      const button = $('<button></button>')
        .text('Log')
        .addClass('test-main-log-button fa-button')
        .css({
          'background-color': '#3498db', // 蓝色背景使按钮更明显
          color: 'white',
          border: 'none',
          padding: '2px 8px',
          'margin-right': '5px',
          'border-radius': '3px',
          cursor: 'pointer',
        })
        .on('click', function (event) {
          event.stopPropagation();
          console.log('[test-main] 消息文本:', messageText);
          console.log('[test-main] 消息元素:', messageElement);

          try {
            if (typeof toastr !== 'undefined') {
              toastr.info(`已记录消息 (ID: ${messageId})`);
            }
          } catch (error) {
            console.error('[test-main] Error showing notification:', error);
          }
        });

      buttonsContainer.prepend(button);
      console.log('[test-main] 强制模式: 按钮已添加到消息:', messageId);
      return true;
    }

    // 如果没有.mes_buttons，尝试添加到.mes_block
    const messageBlock = $(messageElement).find('.mes_block');
    if (messageBlock.length > 0) {
      debugLog(`找到 .mes_block 容器`);

      const button = $('<button></button>')
        .text('Log')
        .addClass('test-main-log-button fa-button')
        .css({
          position: 'absolute',
          top: '5px',
          right: '5px',
          'z-index': '100',
          'background-color': '#3498db',
          color: 'white',
          border: 'none',
          padding: '2px 8px',
          'border-radius': '3px',
          cursor: 'pointer',
        })
        .on('click', function (event) {
          event.stopPropagation();
          console.log('[test-main] 消息文本:', messageText);
          console.log('[test-main] 消息元素:', messageElement);
        });

      messageBlock.css('position', 'relative');
      messageBlock.append(button);
      console.log('[test-main] 强制模式: 按钮已添加到消息块');
      return true;
    }

    return false;
  }

  // 为消息添加记录按钮
  function addLogButton(messageElement, message) {
    try {
      if (!extension_settings[pluginName].enabled) {
        debugLog('插件已禁用，跳过添加按钮');
        return false;
      }

      // 检查是否已经添加了按钮
      if (messageElement.querySelector('.test-main-log-button')) {
        debugLog('该消息已有按钮，跳过');
        return true;
      }

      // 消息按钮容器
      const mesButtons = messageElement.querySelector('.mes_buttons');
      const mesBlock = messageElement.querySelector('.mes_block');
      const mesText = messageElement.querySelector('.mes_text');

      if (!mesButtons || !mesBlock || !mesText) {
        debugLog('消息元素缺少必要容器，跳过', { mesButtons, mesBlock, mesText });
        return false;
      }

      // 从消息对象中获取文本，如果可能的话
      let messageText = '';

      if (message && typeof message.mes === 'string') {
        messageText = message.mes;
        debugLog('从消息对象获取文本:', messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''));
      } else {
        // 如果没有消息对象或消息对象中没有文本，从DOM元素获取
        messageText = mesText.innerText || mesText.textContent || '';
        debugLog('从DOM元素获取文本:', messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''));
      }

      // 如果仍然没有文本，尝试更深入地查找
      if (!messageText.trim()) {
        const swipeContent = mesText.querySelector('.swipe_text');
        if (swipeContent) {
          messageText = swipeContent.innerText || swipeContent.textContent || '';
          debugLog('从swipe_text获取文本:', messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''));
        }
      }

      // 如果消息文本为空，记录警告并继续
      if (!messageText.trim()) {
        debugLog('警告：消息文本为空');
      }

      // 创建按钮
      const buttonWrapper = document.createElement('div');
      buttonWrapper.className = 'test-main-button-wrapper mes_button';

      const logButton = document.createElement('div');
      logButton.className = 'test-main-log-button fa-solid fa-clipboard';
      logButton.title = '复制消息内容';

      // 添加按钮事件
      logButton.addEventListener('click', () => {
        try {
          // 复制到剪贴板
          navigator.clipboard
            .writeText(messageText)
            .then(() => {
              console.log('[test-main] 已复制消息到剪贴板');
              // 显示成功提示
              toastr.success('已复制消息内容到剪贴板');
            })
            .catch(err => {
              console.error('[test-main] 复制到剪贴板失败:', err);
            });
        } catch (error) {
          console.error('[test-main] 按钮点击事件处理出错:', error);
        }
      });

      // 将按钮添加到包装器
      buttonWrapper.appendChild(logButton);

      // 将包装器添加到消息按钮容器
      mesButtons.appendChild(buttonWrapper);
      debugLog('已成功添加按钮到消息元素');

      return true;
    } catch (error) {
      console.error('[test-main] 添加日志按钮时出错:', error);
      return false;
    }
  }

  // 为现有消息添加按钮
  function addButtonsToExistingMessages(context) {
    try {
      if (!extension_settings[pluginName].enabled) {
        debugLog('插件已禁用，跳过添加按钮');
        return;
      }

      // 如果没有传递上下文参数，尝试获取当前上下文
      if (!context) {
        try {
          context = getContext();
          debugLog('未传递上下文参数，已自动获取当前上下文');
        } catch (error) {
          console.error('[test-main] 获取上下文失败:', error);
        }
      }

      // 验证上下文
      if (!context || !context.chat || !Array.isArray(context.chat)) {
        debugLog('无效的聊天上下文，跳过添加按钮');
        return;
      }

      // 获取所有消息元素
      const messageElements = document.querySelectorAll('.mes');
      debugLog(`找到 ${messageElements.length} 个消息元素`);

      if (messageElements.length === 0) {
        return;
      }

      // 构建一个消息ID到消息对象的映射
      const messageMap = {};
      context.chat.forEach(message => {
        if (message && message.mesid !== undefined) {
          messageMap[message.mesid] = message;
        }
      });

      // 遍历每个消息元素
      messageElements.forEach(element => {
        try {
          const mesId = element.getAttribute('mesid');
          let message = null;

          if (mesId !== null && messageMap[mesId]) {
            message = messageMap[mesId];
            debugLog(`找到mesid=${mesId}的消息对象`);
          } else {
            // 没有找到匹配的消息对象，但仍然继续添加按钮
            debugLog(`未找到mesid=${mesId}的消息对象，将直接从DOM中获取文本`);
          }

          // 无论是否找到消息对象，都尝试添加按钮
          if (extension_settings[pluginName].forceButtons || !mesId || !message) {
            // 强制按钮模式或无法获取消息对象，直接将null作为message参数
            addLogButton(element, null);
          } else {
            // 正常模式，传递消息对象
            addLogButton(element, message);
          }
        } catch (error) {
          console.error('[test-main] 处理单个消息元素时出错:', error);
        }
      });

      debugLog('已完成对所有现有消息的按钮添加');
    } catch (error) {
      console.error('[test-main] 添加按钮到现有消息时出错:', error);
    }
  }

  // 扩展加载事件
  eventSource.on(event_types.EXTENSIONS_FIRST_LOAD, () => {
    console.log('[test-main] EXTENSIONS_FIRST_LOAD event triggered');
    try {
      createSettings();
      console.log('[test-main] Plugin loaded successfully. Settings UI created.');

      // 初始延迟后多次尝试添加按钮，确保能捕捉到DOM变化
      setTimeout(addButtonsToExistingMessages, 1000);
      setTimeout(addButtonsToExistingMessages, 3000);
      setTimeout(addButtonsToExistingMessages, 5000);
    } catch (error) {
      console.error('[test-main] Error during EXTENSIONS_FIRST_LOAD handling:', error);
    }
  });

  // Listen for when a new message is added to the chat DOM
  eventSource.on(event_types.MESSAGE_ADDED, (mes, messageElement) => {
    if (!extension_settings[pluginName].enabled) return;

    const messageId = mes?.mesid || 'unknown';
    console.log('[test-main] MESSAGE_ADDED event triggered for message:', messageId);
    debugLog('MESSAGE_ADDED event messageElement:', $(messageElement).attr('class'));

    // 多次尝试添加按钮，确保DOM已完全渲染
    setTimeout(() => {
      try {
        if (!addLogButton(messageElement, mes) && extension_settings[pluginName].forceButtons) {
          addButtonForce(messageElement);
        }
      } catch (error) {
        console.error('[test-main] Error adding button after 100ms:', error);
        // 出错时如果启用了forceButtons，尝试强制添加
        if (extension_settings[pluginName].forceButtons) {
          addButtonForce(messageElement);
        }
      }
    }, 100);

    setTimeout(() => {
      try {
        if (!addLogButton(messageElement, mes) && extension_settings[pluginName].forceButtons) {
          addButtonForce(messageElement);
        }
      } catch (error) {
        console.error('[test-main] Error adding button after 500ms:', error);
        if (extension_settings[pluginName].forceButtons) {
          addButtonForce(messageElement);
        }
      }
    }, 500);
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
                      <div class="test-main-force-row">
                          <span class="test-main-label">强制添加按钮:</span>
                          <input type="checkbox" id="test-main-force-toggle" ${
                            extension_settings[pluginName].forceButtons ? 'checked' : ''
                          }>
                          <span class="test-main-help">(即使没有匹配的消息数据也添加按钮)</span>
                      </div>
                      <div class="test-main-debug-row">
                          <button id="test-main-debug-button" class="menu_button">立即添加按钮</button>
                      </div>
                  </div>
                  <hr class="sysHR">
              </div>
          </div>
      </div>`;

    // 将UI添加到SillyTavern扩展设置区域
    $('#extensions_settings').append(settingsHtml);

    // 设置事件监听器 - 开启/关闭插件
    $('#test-main-toggle').on('change', function () {
      extension_settings[pluginName].enabled = $(this).val() === 'enabled';
      console.log(`[test-main] Plugin ${extension_settings[pluginName].enabled ? 'enabled' : 'disabled'}`);

      // 保存设置到SillyTavern配置
      saveSettingsDebounced();

      // 如果禁用，移除已添加的按钮
      if (!extension_settings[pluginName].enabled) {
        $('.test-main-log-button, .test-main-button-wrapper').remove();
        console.log('[test-main] Removed all log buttons due to plugin being disabled');
      } else {
        // 如果启用，重新添加按钮
        addButtonsToExistingMessages();
      }
    });

    // 设置事件监听器 - 强制添加按钮模式
    $('#test-main-force-toggle').on('change', function () {
      extension_settings[pluginName].forceButtons = $(this).prop('checked');
      console.log(`[test-main] 强制添加按钮模式: ${extension_settings[pluginName].forceButtons ? '开启' : '关闭'}`);

      // 保存设置
      saveSettingsDebounced();

      // 如果开启强制模式，重新添加按钮
      if (extension_settings[pluginName].forceButtons && extension_settings[pluginName].enabled) {
        addButtonsToExistingMessages();
      }
    });

    // 添加调试按钮事件处理
    $('#test-main-debug-button').on('click', function () {
      console.log('[test-main] 调试按钮点击，强制添加按钮');
      addButtonsToExistingMessages();
    });

    // 设置初始值
    $('#test-main-toggle').val(extension_settings[pluginName].enabled ? 'enabled' : 'disabled');

    // 初始化抽屉行为
    initializeDrawer();
  }

  // 初始化抽屉展开/收起功能
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

  // Handle chat updates too, to reapply buttons after message changes
  eventSource.on(event_types.CHAT_UPDATED, () => {
    if (!extension_settings[pluginName].enabled) return;

    console.log('[test-main] CHAT_UPDATED event triggered, checking messages for log buttons.');
    // 延迟操作以确保DOM已更新
    setTimeout(() => {
      try {
        addButtonsToExistingMessages();
      } catch (error) {
        console.error('[test-main] Error in CHAT_UPDATED event handler:', error);
      }
    }, 500);
  });

  // 角色选择变化事件 - 当切换角色时，确保为新的消息添加按钮
  eventSource.on(event_types.CHARACTER_SELECTED, () => {
    console.log('[test-main] CHARACTER_SELECTED event triggered');
    // 多次尝试，确保能捕捉到DOM变化
    setTimeout(() => {
      try {
        addButtonsToExistingMessages();
      } catch (error) {
        console.error('[test-main] Error during CHARACTER_SELECTED handling:', error);
      }
    }, 1000);
  });

  // 聊天加载后执行 - 添加按钮到所有现有消息
  eventSource.on(event_types.CHAT_CHANGED, chatId => {
    console.log('[test-main] CHAT_CHANGED event triggered, chatId:', chatId);
    // 多次尝试，确保能捕捉到DOM变化
    setTimeout(() => {
      try {
        addButtonsToExistingMessages();
      } catch (error) {
        console.error('[test-main] Error during CHAT_CHANGED handling:', error);
      }
    }, 1000);
  });

  // 尝试立即为现有消息添加按钮
  setTimeout(addButtonsToExistingMessages, 1000);
});

console.log('[test-main] Plugin initialized. Waiting for document ready...');
