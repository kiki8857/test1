import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';

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

  // Function to add the log button to a message element
  function addLogButton(messageElement, mes) {
    // Skip if plugin disabled
    if (!extension_settings[pluginName].enabled) return false;

    // 如果没有提供消息对象且启用了强制模式，使用强制添加函数
    if (!mes && extension_settings[pluginName].forceButtons) {
      return addButtonForce(messageElement);
    }

    // Skip if message invalid
    if (!mes || !mes.mesid) {
      debugLog(`跳过无效消息: ${mes ? 'No mesid' : 'No message object'}`);
      return false;
    }

    debugLog(`尝试为消息 ${mes.mesid} 添加按钮`);

    // 检查元素是否已经有按钮
    if ($(messageElement).find('.test-main-log-button').length > 0) {
      debugLog(`消息 ${mes.mesid} 已有按钮，跳过`);
      return false;
    }

    // 以下使用5种不同方法尝试添加按钮，确保至少一个能成功

    // 1. 方法一：尝试添加到.mes_buttons（如果存在）
    const buttonsContainer = $(messageElement).find('.mes_buttons');
    if (buttonsContainer.length > 0) {
      debugLog(`找到 .mes_buttons 容器，消息ID: ${mes.mesid}`);

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
          console.log('[test-main] Message Text:', mes.mes);
          console.log('[test-main] Message Object:', mes);

          try {
            if (typeof toastr !== 'undefined') {
              toastr.info(`Message logged to console (ID: ${mes.mesid})`);
            }
          } catch (error) {
            console.error('[test-main] Error showing notification:', error);
          }
        });

      buttonsContainer.prepend(button);
      console.log('[test-main] 方法一: 按钮已添加到消息:', mes.mesid);
      return true;
    }

    // 2. 方法二：尝试添加到.mes_block（大多数消息的主容器）
    const messageBlock = $(messageElement).find('.mes_block');
    if (messageBlock.length > 0) {
      debugLog(`找到 .mes_block 容器，消息ID: ${mes.mesid}`);

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
          console.log('[test-main] Message Text:', mes.mes);
          console.log('[test-main] Message Object:', mes);
        });

      // 确保mes_block是相对定位的，这样绝对定位的按钮能正确放置
      messageBlock.css('position', 'relative');
      messageBlock.append(button);
      console.log('[test-main] 方法二: 按钮已添加到消息块:', mes.mesid);
      return true;
    }

    // 3. 方法三：尝试添加到.mes_text（消息文本容器）
    const textContainer = $(messageElement).find('.mes_text');
    if (textContainer.length > 0) {
      debugLog(`找到 .mes_text 容器，消息ID: ${mes.mesid}`);

      const buttonWrapper = $('<div></div>').addClass('test-main-button-wrapper').css({
        'text-align': 'right',
        'margin-top': '5px',
      });

      const button = $('<button></button>')
        .text('Log')
        .addClass('test-main-log-button fa-button')
        .css({
          'background-color': '#3498db',
          color: 'white',
          border: 'none',
          padding: '2px 8px',
          'border-radius': '3px',
          cursor: 'pointer',
        })
        .on('click', function (event) {
          event.stopPropagation();
          console.log('[test-main] Message Text:', mes.mes);
          console.log('[test-main] Message Object:', mes);
        });

      buttonWrapper.append(button);
      textContainer.append(buttonWrapper);
      console.log('[test-main] 方法三: 按钮已添加到消息文本后:', mes.mesid);
      return true;
    }

    // 4. 方法四：直接添加到消息元素本身
    debugLog(`尝试直接添加到消息元素，消息ID: ${mes.mesid}`);

    const button = $('<button></button>')
      .text('Log')
      .addClass('test-main-log-button fa-button')
      .css({
        display: 'block',
        margin: '5px auto',
        'background-color': '#3498db',
        color: 'white',
        border: 'none',
        padding: '2px 8px',
        'border-radius': '3px',
        cursor: 'pointer',
      })
      .on('click', function (event) {
        event.stopPropagation();
        console.log('[test-main] Message Text:', mes.mes);
        console.log('[test-main] Message Object:', mes);
      });

    $(messageElement).append(button);
    console.log('[test-main] 方法四: 按钮已直接添加到消息元素:', mes.mesid);
    return true;
  }

  // 在页面初始加载时添加按钮到已有消息
  function addButtonsToExistingMessages() {
    if (!extension_settings[pluginName].enabled) return;

    console.log('[test-main] Checking for existing messages...');

    // 查找所有可能的消息元素
    const allMessages = $('.mes');
    debugLog(`找到 ${allMessages.length} 条可能的消息`);

    // 记录每条消息的关键状态
    allMessages.each(function (index) {
      const messageElement = this;
      debugLog(`消息 #${index} 类名:`, $(messageElement).attr('class'));
      debugLog(`消息 #${index} mesid:`, $(messageElement).attr('mesid'));
      debugLog(`消息 #${index} 是否有 .mes_buttons:`, $(messageElement).find('.mes_buttons').length > 0);
      debugLog(`消息 #${index} 是否有 .mes_block:`, $(messageElement).find('.mes_block').length > 0);
      debugLog(`消息 #${index} 是否有 .mes_text:`, $(messageElement).find('.mes_text').length > 0);
    });

    try {
      const context = getContext();

      // 检查聊天数据是否可用
      if (context && context.chat && Array.isArray(context.chat)) {
        debugLog(`聊天数据可用，聊天数组长度:`, context.chat.length);

        // 打印每一条聊天数据的mesid
        context.chat.forEach((message, index) => {
          debugLog(`聊天数据 #${index}, mesid:`, message.mesid);
        });
      } else {
        debugLog(
          `聊天数据不可用或无效:`,
          context ? `chat属性: ${!!context.chat}, 是数组: ${Array.isArray(context?.chat)}` : '无context',
        );
      }

      // 如果强制添加按钮，则直接为所有消息元素添加按钮
      if (extension_settings[pluginName].forceButtons) {
        allMessages.each(function () {
          addButtonForce(this);
        });
        return;
      }

      // 否则，尝试为找到有效聊天数据的消息添加按钮
      if (context && context.chat && Array.isArray(context.chat)) {
        $('.mes').each(function () {
          const messageElement = this;
          const messageId = $(messageElement).attr('mesid');

          if (messageId) {
            // 尝试两种方式查找：字符串全等比较和数值比较（处理"0"与0的比较情况）
            const message = context.chat.find(
              m => String(m.mesid) === String(messageId) || m.mesid === parseInt(messageId),
            );

            if (message) {
              addLogButton(messageElement, message);
            } else {
              debugLog(`消息ID ${messageId} 在聊天数据中未找到匹配`);
              // 如果找不到匹配但已启用forceButtons，则强制添加按钮
              if (extension_settings[pluginName].forceButtons) {
                addButtonForce(messageElement);
              }
            }
          } else {
            debugLog(`消息元素没有 mesid 属性:`, $(messageElement).attr('class'));
            // 如果没有mesid但已启用forceButtons，则强制添加按钮
            if (extension_settings[pluginName].forceButtons) {
              addButtonForce(messageElement);
            }
          }
        });
      } else {
        console.warn('[test-main] No valid chat context available');
        // 如果聊天上下文不可用但启用了forceButtons，则对所有消息强制添加按钮
        if (extension_settings[pluginName].forceButtons) {
          $('.mes').each(function () {
            addButtonForce(this);
          });
        }
      }
    } catch (error) {
      console.error('[test-main] Error adding buttons to existing messages:', error);
      // 错误发生时，如果启用了forceButtons，则对所有消息强制添加按钮
      if (extension_settings[pluginName].forceButtons) {
        $('.mes').each(function () {
          addButtonForce(this);
        });
      }
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
