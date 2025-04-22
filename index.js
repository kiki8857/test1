import { eventSource, event_types } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';

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
  const buttonsContainer = messageElement.querySelector('.mes_buttons');

  // Only proceed if the container exists and our button isn't already there
  if (buttonsContainer && !buttonsContainer.querySelector('.test-main-log-button')) {
    const button = document.createElement('button');
    button.textContent = 'Log';
    button.classList.add('test-main-log-button', 'fa-button'); // Added fa-button for some base styling if needed

    button.addEventListener('click', event => {
      event.stopPropagation(); // Prevent potential parent handlers
      console.log('[test-main] Message Text:', mes.mes);
      console.log('[test-main] Message Object:', mes);
      toastr.info(`Message logged to console (ID: ${mes.mesid})`); // Provide visual feedback
    });

    // Prepend the button to the container
    buttonsContainer.prepend(button);
  } else if (!buttonsContainer) {
    // Fallback or logging if the expected container isn't found
    console.warn('[test-main] Could not find .mes_buttons container for message:', mes.mesid);
  }
}

// Listen for when a new message is added to the chat DOM
eventSource.on(event_types.MESSAGE_ADDED, (mes, messageElement) => {
  if (!extension_settings[pluginName].enabled) return;

  // Wait a moment for the message element to be fully rendered, especially buttons
  setTimeout(() => {
    addLogButton(messageElement, mes);
  }, 100); // Small delay might help ensure .mes_buttons is ready
});

// Handle chat updates too, to reapply buttons after message changes
eventSource.on(event_types.CHAT_UPDATED, () => {
  if (!extension_settings[pluginName].enabled) return;

  console.log('[test-main] Chat updated, checking messages for log buttons.');
  setTimeout(() => {
    document.querySelectorAll('.mes').forEach(msgElement => {
      const messageId = msgElement.getAttribute('mesid');
      if (messageId) {
        const context = getContext();
        const message = context.chat.find(m => m.mesid === messageId);
        if (message) {
          addLogButton(msgElement, message);
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

// 扩展加载事件
eventSource.on(event_types.EXTENSIONS_FIRST_LOAD, () => {
  createSettings();
  console.log('[test-main] Plugin loaded successfully.');
});

console.log('[test-main] Plugin initialized.');
