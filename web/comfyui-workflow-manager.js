import { app } from "../../scripts/app.js";

// 工作流管理器类
class WorkflowManager {
  constructor() {
    // 初始化
  }

  // 格式化日期时间为指定格式
  formatDateTime(dateTimeString) {
    try {
      const date = new Date(dateTimeString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      // 格式化为 yyyy-MM-dd HH:mm:ss
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error("日期格式化错误", error);
      return dateTimeString || '-';
    }
  }

  // 添加对话框外部点击关闭和ESC键关闭功能
  setupDialogCloseEvents(dialog, onClose) {
    // 点击对话框外部区域关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        if (typeof onClose === 'function') {
          onClose(false);
        }
        document.body.removeChild(dialog);
      }
    });
    
    // ESC键关闭
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (typeof onClose === 'function') {
          onClose(false);
        }
        document.body.removeChild(dialog);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // 返回清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }

  // 自定义 alert 对话框
  showAlert(message, title = "提示") {
    return new Promise((resolve) => {
      // 创建对话框DOM元素
      const dialog = document.createElement("div");
      dialog.className = "workflow-dialog";
      dialog.innerHTML = `
        <div class="workflow-dialog-content workflow-dialog-small">
          <div class="workflow-dialog-header">
            <h3>${title}</h3>
            <button class="workflow-dialog-close">&times;</button>
          </div>
          <div class="workflow-dialog-body">
            <div class="workflow-message">${message}</div>
          </div>
          <div class="workflow-dialog-footer">
            <button id="alert-confirm-btn" class="workflow-btn workflow-btn-primary">确定</button>
          </div>
        </div>
      `;
      
      // 添加对话框样式
      this.addDialogStyles();
      
      // 将对话框添加到文档
      document.body.appendChild(dialog);
      
      // 关闭按钮事件
      dialog.querySelector(".workflow-dialog-close").onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };
      
      // 确认按钮事件
      dialog.querySelector("#alert-confirm-btn").onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };
      
      // 添加对话框外部点击和ESC关闭
      this.setupDialogCloseEvents(dialog, resolve);
    });
  }
  
  // 自定义 confirm 对话框
  showConfirm(message, title = "确认") {
    return new Promise((resolve) => {
      // 创建对话框DOM元素
      const dialog = document.createElement("div");
      dialog.className = "workflow-dialog";
      dialog.innerHTML = `
        <div class="workflow-dialog-content workflow-dialog-small">
          <div class="workflow-dialog-header">
            <h3>${title}</h3>
            <button class="workflow-dialog-close">&times;</button>
          </div>
          <div class="workflow-dialog-body">
            <div class="workflow-message">${message}</div>
          </div>
          <div class="workflow-dialog-footer">
            <button id="confirm-cancel-btn" class="workflow-btn">取消</button>
            <button id="confirm-ok-btn" class="workflow-btn workflow-btn-primary">确定</button>
          </div>
        </div>
      `;
      
      // 添加对话框样式
      this.addDialogStyles();
      
      // 将对话框添加到文档
      document.body.appendChild(dialog);
      
      // 关闭按钮事件
      dialog.querySelector(".workflow-dialog-close").onclick = () => {
        document.body.removeChild(dialog);
        resolve(false);
      };
      
      // 取消按钮事件
      dialog.querySelector("#confirm-cancel-btn").onclick = () => {
        document.body.removeChild(dialog);
        resolve(false);
      };
      
      // 确认按钮事件
      dialog.querySelector("#confirm-ok-btn").onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };
      
      // 添加对话框外部点击和ESC关闭
      this.setupDialogCloseEvents(dialog, resolve);
    });
  }

  // 显示工作流保存对话框
  async showSaveWorkflowDialog() {
    // 获取当前工作流
    const workflow = app.graph.serialize();
    
    // 增强工作流信息，添加widgets name信息
    this.enhanceWorkflowWithWidgetsInfo(workflow);
    
    // 创建对话框DOM元素
    const dialog = document.createElement("div");
    dialog.className = "workflow-dialog";
    dialog.innerHTML = `
      <div class="workflow-dialog-content workflow-dialog-small">
        <div class="workflow-dialog-header">
          <h3>保存工作流</h3>
          <button class="workflow-dialog-close">&times;</button>
        </div>
        <div class="workflow-dialog-body">
          <div class="workflow-form-group">
            <label for="workflow-id">工作流ID (可选)</label>
            <input type="text" id="workflow-id" placeholder="仅支持英文、数字、横线和下划线" pattern="[a-zA-Z0-9_-]*" />
            <div class="workflow-form-help">如不填写，系统将自动生成</div>
          </div>
          <div class="workflow-form-group">
            <label for="workflow-name">工作流名称</label>
            <input type="text" id="workflow-name" placeholder="请输入工作流名称" />
          </div>
          <div class="workflow-form-group">
            <label for="workflow-desc">描述 (可选)</label>
            <textarea id="workflow-desc" placeholder="工作流描述 (可选)" rows="3"></textarea>
          </div>
        </div>
        <div class="workflow-dialog-footer">
          <button id="save-workflow-btn" class="workflow-btn workflow-btn-primary">保存</button>
          <button id="cancel-btn" class="workflow-btn">取消</button>
        </div>
      </div>
    `;
    
    // 添加对话框样式
    this.addDialogStyles();
    
    // 将对话框添加到文档
    document.body.appendChild(dialog);
    
    // 添加事件处理
    dialog.querySelector(".workflow-dialog-close").onclick = () => {
      document.body.removeChild(dialog);
    };
    
    dialog.querySelector("#cancel-btn").onclick = () => {
      document.body.removeChild(dialog);
    };
    
    // 添加ID字段输入限制
    const workflowIdInput = dialog.querySelector("#workflow-id");
    workflowIdInput.addEventListener("input", function() {
      // 移除所有非法字符（只保留英文、数字、横线和下划线）
      this.value = this.value.replace(/[^a-zA-Z0-9_-]/g, "");
    });
    
    // 保存工作流按钮事件
    dialog.querySelector("#save-workflow-btn").onclick = async () => {
      const name = dialog.querySelector("#workflow-name").value.trim();
      const workflowId = dialog.querySelector("#workflow-id").value.trim();
      const description = dialog.querySelector("#workflow-desc").value.trim();
      
      if (!name) {
        this.showAlert("请输入工作流名称");
        return;
      }
      
      try {
        await this.saveWorkflow(name, description, workflow, workflowId);
        document.body.removeChild(dialog);
        this.showAlert("工作流保存成功");
      } catch (error) {
        this.showAlert(`保存失败: ${error.message}`, "保存错误");
      }
    };
    
    // 添加对话框外部点击和ESC关闭
    this.setupDialogCloseEvents(dialog);
  }
  
  // 显示工作流列表对话框
  async showWorkflowListDialog() {
    try {
      // 获取工作流列表
      const workflows = await this.getWorkflowList();
      
      // 创建对话框DOM元素
      const dialog = document.createElement("div");
      dialog.className = "workflow-dialog";
      dialog.innerHTML = `
        <div class="workflow-dialog-content workflow-dialog-large">
          <div class="workflow-dialog-header">
            <h3>工作流列表</h3>
            <button class="workflow-dialog-close">&times;</button>
          </div>
          <div class="workflow-dialog-body">
            <div class="workflow-search">
              <input type="text" id="workflow-search" placeholder="搜索工作流..." />
              <button id="workflow-search-btn" class="workflow-btn">搜索</button>
            </div>
            <div class="workflow-list">
              <table class="workflow-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>名称</th>
                    <th>描述</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${workflows.length > 0 ? 
                    workflows.map(wf => `
                      <tr data-workflow-id="${wf.id}">
                        <td>
                          <span class="workflow-id-text" title="点击复制ID">${wf.id}</span>
                          <button class="workflow-btn workflow-btn-small workflow-copy-btn" data-copy-text="${wf.id}" title="复制ID">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </td>
                        <td>${wf.name}</td>
                        <td>${wf.description || '-'}</td>
                        <td>${this.formatDateTime(wf.created_at)}</td>
                        <td>
                          <button class="workflow-btn workflow-btn-small load-workflow-btn">加载</button>
                          <button class="workflow-btn workflow-btn-small workflow-btn-danger delete-workflow-btn">删除</button>
                          <button class="workflow-btn workflow-btn-small workflow-btn-primary execute-workflow-btn" title="执行此工作流">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            执行
                          </button>
                        </td>
                      </tr>
                    `).join("") : 
                    '<tr><td colspan="5" class="empty-list">没有保存的工作流</td></tr>'
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div class="workflow-dialog-footer">
            <button id="refresh-btn" class="workflow-btn">刷新列表</button>
            <button id="close-btn" class="workflow-btn">关闭</button>
          </div>
        </div>
      `;
      
      // 添加对话框样式
      this.addDialogStyles();
      
      // 将对话框添加到文档
      document.body.appendChild(dialog);
      
      // 关闭按钮事件
      dialog.querySelector(".workflow-dialog-close").onclick = () => {
        document.body.removeChild(dialog);
      };
      
      dialog.querySelector("#close-btn").onclick = () => {
        document.body.removeChild(dialog);
      };
      
      // 刷新列表
      dialog.querySelector("#refresh-btn").onclick = () => {
        document.body.removeChild(dialog);
        this.showWorkflowListDialog();
      };
      
      // 搜索功能
      const searchInput = dialog.querySelector("#workflow-search");
      const searchBtn = dialog.querySelector("#workflow-search-btn");
      const handleSearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        dialog.querySelectorAll(".workflow-table tbody tr").forEach(row => {
          if (row.classList.contains("empty-list")) return;
          
          const id = row.cells[0].textContent.toLowerCase();
          const name = row.cells[1].textContent.toLowerCase();
          const desc = row.cells[2].textContent.toLowerCase();
          if (name.includes(searchTerm) || desc.includes(searchTerm) || id.includes(searchTerm)) {
            row.style.display = "";
          } else {
            row.style.display = "none";
          }
        });
      };
      
      searchBtn.onclick = handleSearch;
      searchInput.onkeyup = (e) => {
        if (e.key === "Enter") handleSearch();
      };
      
      // 复制ID按钮事件
      dialog.querySelectorAll(".workflow-copy-btn").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const text = btn.getAttribute("data-copy-text");
          this.copyToClipboard(text);
          
          // 显示临时复制成功提示
          const originalTitle = btn.getAttribute("title");
          btn.setAttribute("title", "已复制!");
          btn.style.backgroundColor = "#43cea2";
          
          // 2秒后恢复原样
          setTimeout(() => {
            btn.setAttribute("title", originalTitle);
            btn.style.backgroundColor = "";
          }, 2000);
        };
      });
      
      // ID文本点击复制事件
      dialog.querySelectorAll(".workflow-id-text").forEach(span => {
        span.onclick = () => {
          const text = span.textContent;
          this.copyToClipboard(text);
          
          // 显示临时复制成功提示
          const originalTitle = span.getAttribute("title");
          span.setAttribute("title", "已复制!");
          span.style.color = "#43cea2";
          
          // 2秒后恢复原样
          setTimeout(() => {
            span.setAttribute("title", originalTitle);
            span.style.color = "";
          }, 2000);
        };
      });
      
      // 加载工作流按钮事件
      dialog.querySelectorAll(".load-workflow-btn").forEach(btn => {
        btn.onclick = async (e) => {
          const row = e.target.closest("tr");
          const workflowId = row.getAttribute("data-workflow-id");
          const workflowName = row.cells[1].textContent;
          
          const confirmed = await this.showConfirm(`确定要加载工作流 "${workflowName}" 吗？当前未保存的工作流将会丢失。`, "加载确认");
          if (confirmed) {
            try {
              await this.loadWorkflow(workflowId);
              document.body.removeChild(dialog);
            } catch (error) {
              this.showAlert(`加载工作流失败: ${error.message}`, "加载失败");
            }
          }
        };
      });
      
      // 删除工作流按钮事件
      dialog.querySelectorAll(".delete-workflow-btn").forEach(btn => {
        btn.onclick = async (e) => {
          const row = e.target.closest("tr");
          const workflowId = row.getAttribute("data-workflow-id");
          const workflowName = row.cells[1].textContent;
          
          const confirmed = await this.showConfirm(`确定要删除工作流 "${workflowName}" 吗？此操作不可撤销。`, "删除确认");
          if (confirmed) {
            try {
              await this.deleteWorkflow(workflowId);
              
              // 先保存对tbody的引用
              const tbody = row.parentElement;
              
              // 删除行
              row.remove();
              
              // 检查tbody是否仍然存在于DOM中并且没有可见的行
              if (tbody && tbody.isConnected && tbody.querySelectorAll("tr:not([style*='display: none'])").length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-list">没有保存的工作流</td></tr>';
              }
              
              this.showAlert("工作流删除成功", "删除成功");
            } catch (error) {
              this.showAlert(`删除工作流失败: ${error.message}`, "删除失败");
            }
          }
        };
      });
      
      // 执行工作流按钮事件
      dialog.querySelectorAll(".execute-workflow-btn").forEach(btn => {
        btn.onclick = async (e) => {
          const row = e.target.closest("tr");
          const workflowId = row.getAttribute("data-workflow-id");
          
          try {
            // 获取工作流数据以解析参数
            const workflowData = await this.getWorkflowData(workflowId);
            const paramTemplate = this.extractWorkflowParams(workflowData);
            
            // 关闭当前对话框
            document.body.removeChild(dialog);
            
            // 打开执行对话框并预填充数据
            this.showExecuteWorkflowDialog(workflowId, paramTemplate);
          } catch (error) {
            this.showAlert(`获取工作流参数失败: ${error.message}`, "获取失败");
          }
        };
      });
      
      // 添加对话框外部点击和ESC关闭
      this.setupDialogCloseEvents(dialog);
    } catch (error) {
      console.error("[Workflow Manager] 获取工作流列表失败:", error);
      this.showAlert(`获取工作流列表失败: ${error.message}`, "获取失败");
    }
  }
  
  // 获取工作流列表
  async getWorkflowList() {
    try {
      const response = await fetch("/api/workflow/list");
      const result = await response.json();
      
      if (result.status !== "success") {
        throw new Error(result.message || "获取工作流列表失败");
      }
      
      return result.workflows || [];
    } catch (error) {
      console.error("[Workflow Manager] 获取工作流列表失败:", error);
      throw error;
    }
  }
  
  // 保存工作流
  async saveWorkflow(name, description, workflow, id = "") {
    try {
      // 输出调试信息，查看工作流中的节点和widgets_params信息
      console.log(`[Workflow Manager] 准备保存工作流 "${name}"`);
      const nodeWidgetsInfo = {};
      if (workflow && workflow.nodes && Array.isArray(workflow.nodes)) {
        workflow.nodes.forEach(node => {
          if (node.type && node.id) {
            nodeWidgetsInfo[node.id] = {
              type: node.type,
              has_widgets_params: !!node.widgets_params && Array.isArray(node.widgets_params),
              widgets_params_count: node.widgets_params ? node.widgets_params.length : 0,
              has_values: !!node.widgets_values && Array.isArray(node.widgets_values),
              values_count: node.widgets_values ? node.widgets_values.length : 0
            };
          }
        });
      }
      console.log(`[Workflow Manager] 工作流包含 ${Object.keys(nodeWidgetsInfo).length} 个节点的widgets_params信息:`, nodeWidgetsInfo);
      
      const response = await fetch("/api/workflow/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          workflow: JSON.stringify(workflow),
          id: id || undefined // 如果ID为空字符串则不发送该字段
        })
      });
      
      const result = await response.json();
      
      if (result.status !== "success") {
        throw new Error(result.message || "保存工作流失败");
      }
      
      return result;
    } catch (error) {
      console.error("[Workflow Manager] 保存工作流失败:", error);
      throw error;
    }
  }
  
  // 加载工作流
  async loadWorkflow(workflowId) {
    try {
      const response = await fetch(`/api/workflow/get/${workflowId}`);
      const result = await response.json();
      
      if (result.status !== "success") {
        throw new Error(result.message || "加载工作流失败");
      }
      
      const workflow = JSON.parse(result.workflow);
      
      // 清除当前工作流并加载新的
      app.graph.clear();
      app.loadGraphData(workflow);
      
      return result;
    } catch (error) {
      console.error("[Workflow Manager] 加载工作流失败:", error);
      throw error;
    }
  }
  
  // 删除工作流
  async deleteWorkflow(workflowId) {
    try {
      const response = await fetch(`/api/workflow/delete/${workflowId}`, {
        method: "DELETE"
      });
      
      const result = await response.json();
      
      if (result.status !== "success") {
        throw new Error(result.message || "删除工作流失败");
      }
      
      return result;
    } catch (error) {
      console.error("[Workflow Manager] 删除工作流失败:", error);
      throw error;
    }
  }
  
  // 获取工作流数据
  async getWorkflowData(workflowId) {
    try {
      const response = await fetch(`/api/workflow/get/${workflowId}`);
      const result = await response.json();
      
      if (result.status !== "success") {
        throw new Error(result.message || "获取工作流数据失败");
      }
      
      const workflow = JSON.parse(result.workflow);
      
      // 缓存工作流数据用于连接查找
      this.cacheWorkflowForExecution(workflow);
      
      return workflow;
    } catch (error) {
      console.error("[Workflow Manager] 获取工作流数据失败:", error);
      throw error;
    }
  }
  
  // 从工作流中提取输入参数模板
  extractWorkflowParams(workflow) {
    try {
      const params = {};
      
      // 检查工作流节点
      if (workflow && workflow.nodes) {
        console.log("[Workflow Manager] 开始遍历工作流节点，节点数量:", Object.keys(workflow.nodes).length);
        
        // 遍历所有节点
        for (const nodeId in workflow.nodes) {
          const node = workflow.nodes[nodeId];
          
          // 只检测type为iyunya_in_开头的节点
          if (node.type && node.type.startsWith("iyunya_in_")) {
            console.log(`[Workflow Manager] 发现输入节点: ${node.type}`);
            
            // 如果节点有inputs，提取所有输入参数
            if (node.inputs) {
              console.log(`[Workflow Manager] 节点inputs数量: ${node.inputs.length}`);
              
              // 遍历节点的所有输入
              node.inputs.forEach((input, index) => {
                if (input.name) {
                  console.log(`[Workflow Manager] 输入参数 ${index}: 名称=${input.name}, 类型=${input.type}`);
                  
                  // 尝试找到该输入的默认值
                  let paramValue = "";
                  
                  // 如果有widgets_params，尝试从中获取对应参数的值
                  if (node.widgets_params) {
                    const matchingWidget = node.widgets_params.find(w => w.name === input.name);
                    if (matchingWidget) {
                      paramValue = matchingWidget.value || "";
                      console.log(`[Workflow Manager] 从widget获取参数值: ${paramValue}`);
                    }
                  }
                  
                  // 如果没找到widget，尝试从属性中查找
                  if (paramValue === "" && node.properties && node.properties[input.name] !== undefined) {
                    paramValue = node.properties[input.name];
                    console.log(`[Workflow Manager] 从properties获取参数值: ${paramValue}`);
                  }
                  
                  // 添加到参数列表
                  params[input.name] = paramValue;
                  console.log(`[Workflow Manager] 添加参数: ${input.name} = ${paramValue}`);
                }
              });
            } else {
              console.log(`[Workflow Manager] 节点没有输入参数定义`);
              
              // 如果没有明确的inputs定义但有widgets_params，使用widgets_params作为参数
              if (node.widgets_params && node.widgets_params.length > 0) {
                console.log(`[Workflow Manager] 使用widgets_params作为参数，数量: ${node.widgets_params.length}`);
                
                node.widgets_params.forEach(widget => {
                  if (widget.name) {
                    params[widget.name] = widget.value;
                    console.log(`[Workflow Manager] 添加widget参数: ${widget.name} = ${widget.value}`);
                  }
                });
              }
            }
          }
        }
      } else {
        console.log("[Workflow Manager] 工作流没有节点或节点结构无效");
      }
      
      console.log("[Workflow Manager] 提取的参数模板:", params);
      return params;
    } catch (error) {
      console.error("[Workflow Manager] 提取工作流参数失败:", error);
      return {};
    }
  }
  
  // 显示带参数执行工作流对话框
  async showExecuteWorkflowDialog(prefillWorkflowId = "", prefillParams = {}) {
    // 创建对话框DOM元素
    const dialog = document.createElement("div");
    dialog.className = "workflow-dialog";
    dialog.innerHTML = `
      <div class="workflow-dialog-content workflow-dialog-small">
        <div class="workflow-dialog-header">
          <h3>执行工作流</h3>
          <button class="workflow-dialog-close">&times;</button>
        </div>
        <div class="workflow-dialog-body">
          <div class="workflow-form-group">
            <label for="execute-workflow-id">工作流ID</label>
            <input type="text" id="execute-workflow-id" placeholder="请输入工作流ID" pattern="[a-zA-Z0-9_-]*" value="${prefillWorkflowId}" />
          </div>
          <div class="workflow-form-group">
            <label for="execute-params">参数 (JSON格式)</label>
            <textarea id="execute-params" placeholder='{\n  "prompt": "一只可爱的猫",\n  "seed": 42,\n  "width": 512,\n  "height": 512\n}' rows="10" style="font-family: monospace;">${Object.keys(prefillParams).length > 0 ? JSON.stringify(prefillParams, null, 2) : ''}</textarea>
            <div class="workflow-form-help">JSON格式的参数，用于替换工作流中以iyunya_in_开头的节点输入</div>
          </div>
        </div>
        <div class="workflow-dialog-footer">
          <button id="execute-workflow-btn" class="workflow-btn workflow-btn-primary">执行</button>
          <button id="cancel-btn" class="workflow-btn">取消</button>
        </div>
      </div>
    `;
    
    // 添加对话框样式
    this.addDialogStyles();
    
    // 将对话框添加到文档
    document.body.appendChild(dialog);
    
    // 添加事件处理
    dialog.querySelector(".workflow-dialog-close").onclick = () => {
      document.body.removeChild(dialog);
    };
    
    dialog.querySelector("#cancel-btn").onclick = () => {
      document.body.removeChild(dialog);
    };
    
    // 执行工作流按钮事件
    dialog.querySelector("#execute-workflow-btn").onclick = async () => {
      const workflowId = dialog.querySelector("#execute-workflow-id").value.trim();
      const paramsText = dialog.querySelector("#execute-params").value.trim();
      
      if (!workflowId) {
        this.showAlert("请输入工作流ID");
        return;
      }
      
      // 参数可以为空，移除强制要求
      
      // 尝试解析JSON，如果为空则使用空对象
      let params = {};
      if (paramsText) {
        try {
          params = JSON.parse(paramsText);
        } catch (error) {
          this.showAlert(`JSON解析失败: ${error.message}`, "参数错误");
          return;
        }
      }
      
      try {
        await this.executeWorkflow(workflowId, params);
        document.body.removeChild(dialog);
        this.showAlert("工作流已提交执行，请在ComfyUI界面查看执行进度");
      } catch (error) {
        this.showAlert(`执行失败: ${error.message}`, "执行错误");
      }
    };
    
    // 添加对话框外部点击和ESC关闭
    this.setupDialogCloseEvents(dialog);
  }
  
  // 执行带参数的工作流
  async executeWorkflow(workflowId, params) {
    try {
      console.log("[Workflow Manager] 执行工作流:", workflowId, "参数:", params);
      
      // 确保params是一个对象
      params = params || {};
      
      // 发送API请求执行工作流，由后端执行转换逻辑
      const response = await fetch(`/api/workflow/execute/${workflowId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          params: params
        })
      });
      
      const result = await response.json();
      
      if (result.status !== "success") {
        throw new Error(result.message || "执行工作流失败");
      }
      
      return result;
    } catch (error) {
      console.error("[Workflow Manager] 执行工作流失败:", error);
      throw error;
    }
  }
  
  // 执行前缓存当前工作流
  cacheWorkflowForExecution(workflow) {
    this.currentWorkflow = workflow;
  }
  
  // 复制文本到剪贴板
  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log("[Workflow Manager] 复制到剪贴板成功");
      },
      (err) => {
        console.error("[Workflow Manager] 复制到剪贴板失败:", err);
      }
    );
  }
  
  // 添加对话框样式
  addDialogStyles() {
    // 检查是否已添加样式
    if (document.getElementById("workflow-dialog-styles")) {
      return;
    }
    
    const style = document.createElement("style");
    style.id = "workflow-dialog-styles";
    style.textContent = `
      .workflow-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .workflow-dialog-content {
        background: #222;
        border-radius: 8px;
        width: 500px;
        max-width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      
      .workflow-dialog-small {
        width: 400px;
      }
      
      .workflow-dialog-large {
        width: 800px;
      }
      
      .workflow-dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #333;
      }
      
      .workflow-dialog-header h3 {
        margin: 0;
        color: #ddd;
        font-size: 18px;
      }
      
      .workflow-dialog-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
      }
      
      .workflow-dialog-body {
        padding: 20px;
      }
      
      .workflow-message {
        color: #eee;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 10px;
      }
      
      .workflow-dialog-footer {
        padding: 15px 20px;
        border-top: 1px solid #333;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .workflow-form-group {
        margin-bottom: 15px;
      }
      
      .workflow-form-group label {
        display: block;
        margin-bottom: 5px;
        color: #ccc;
      }
      
      .workflow-form-help {
        font-size: 12px;
        color: #999;
        margin-top: 2px;
        font-style: italic;
      }
      
      .workflow-form-group input,
      .workflow-form-group select,
      .workflow-form-group textarea {
        width: 100%;
        padding: 8px 10px;
        background: #333;
        border: 1px solid #444;
        border-radius: 4px;
        color: #eee;
        margin-bottom: 8px;
        font-family: inherit;
      }
      
      .workflow-btn {
        background: #555;
        border: none;
        color: #eee;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .workflow-btn:hover {
        background: #666;
      }
      
      .workflow-btn-primary {
        background: #0074d9;
      }
      
      .workflow-btn-primary:hover {
        background: #0063b6;
      }
      
      .workflow-btn-danger {
        background: #ff4136;
      }
      
      .workflow-btn-danger:hover {
        background: #e63329;
      }
      
      .workflow-btn-small {
        padding: 4px 8px;
        font-size: 12px;
      }
      
      .workflow-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .workflow-table th,
      .workflow-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #333;
      }
      
      .workflow-table th {
        color: #ddd;
        font-weight: bold;
        background: #2a2a2a;
      }
      
      .empty-list {
        text-align: center;
        color: #888;
        padding: 20px !important;
      }
      
      .workflow-search {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
      
      .workflow-search input {
        flex: 1;
        padding: 8px 10px;
        background: #333;
        border: 1px solid #444;
        border-radius: 4px;
        color: #eee;
      }
      
      /* 图标按钮样式 */
      .workflow-icon-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 5px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        width: 30px;
        height: 30px;
      }
      
      .workflow-icon-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .workflow-icon-btn svg {
        width: 20px;
        height: 20px;
      }
      
      /* ID文本样式 */
      .workflow-id-text {
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        background: #333;
        display: inline-block;
        margin-right: 5px;
      }
      
      .workflow-id-text:hover {
        background: #3a3a3a;
      }
      
      .workflow-copy-btn {
        vertical-align: middle;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
      }
      
      .workflow-copy-btn svg {
        width: 14px;
        height: 14px;
      }
      
      /* 执行按钮样式 */
      .execute-workflow-btn {
        background-color: #6c5ce7;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      
      .execute-workflow-btn:hover {
        background-color: #5546d3;
      }
      
      .execute-workflow-btn svg {
        vertical-align: middle;
        margin-right: 2px;
      }
    `;
    
    document.head.appendChild(style);
  }

  // 增强工作流信息，添加widgets name信息
  enhanceWorkflowWithWidgetsInfo(workflow) {
    console.log('[Workflow Manager] 增强工作流信息，添加widgets name信息');
    
    if (!workflow || !workflow.nodes || !Array.isArray(workflow.nodes)) {
      console.warn('[Workflow Manager] 工作流格式不正确，无法增强');
      return workflow;
    }
    
    // 遍历所有节点
    for (const node of workflow.nodes) {
      // 确保节点有ID和类型
      if (!node.id || !node.type) continue;
      
      try {
        // 查找正在运行的对应节点实例
        const liveNode = app.graph._nodes_by_id[node.id];
        if (!liveNode) {
          console.warn(`[Workflow Manager] 未找到节点实例: ${node.id}`);
          continue;
        }
        
        // 如果节点有widgets_values但没有widgets_params定义
        if (node.widgets_values && (!node.widgets_params || !node.widgets_params.length)) {
          console.log(`[Workflow Manager] 节点 ${node.id} (${node.type}) 没有widgets_params定义，尝试从实例获取`);
          
          // 创建widgets_params数组（如果不存在）
          if (!node.widgets_params) {
            node.widgets_params = [];
          }
          
          // 从实例中获取widgets信息
          if (liveNode.widgets) {
            for (let i = 0; i < liveNode.widgets.length; i++) {
              const widget = liveNode.widgets[i];
              
              // 如果widgets_values数组长度不够，跳过
              if (i >= node.widgets_values.length) continue;
              
              // 创建widget定义信息
              const widgetInfo = {
                name: widget.name || `param_${i}`, // 使用widget名称或默认参数名
                type: widget.type || 'string'      // 使用widget类型或默认为字符串
              };
              
              // 添加到节点的widgets_params数组
              node.widgets_params.push(widgetInfo);
              console.log(`[Workflow Manager] 为节点 ${node.id} 添加widget定义: ${widgetInfo.name}`);
            }
          }
        }
      } catch (error) {
        console.error(`[Workflow Manager] 处理节点 ${node.id} widgets信息时出错:`, error);
      }
    }
    
    console.log('[Workflow Manager] 工作流信息增强完成');
    return workflow;
  }
}

// 创建全局实例
let workflowManagerInstance = null;

// 主扩展注册
app.registerExtension({
  name: "workflow.manager",
  init() {
    // 初始化函数
    console.log("工作流管理器扩展初始化");
  },
  async setup() {
    console.log("工作流管理器扩展已加载");
    
    try {
      // 等待菜单和按钮组加载 - 直接复制 iyunya-nodes 的代码
      const waitForButtonGroup = () => {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            // 查找右侧菜单中的按钮组，特别是包含Manager按钮的那个
            const menuRight = document.querySelector(".comfyui-menu-right");
            if (menuRight) {
              const buttonGroups = menuRight.querySelectorAll(".comfyui-button-group");
              if (buttonGroups.length > 0) {
                // 查找包含Manager按钮的按钮组
                for (const group of buttonGroups) {
                  if (group.querySelector('button[title="ComfyUI Manager"]')) {
                    clearInterval(checkInterval);
                    resolve({menuRight, managerGroup: group});
                    return;
                  }
                }
                // 如果没找到包含Manager的组，使用最后一个按钮组
                clearInterval(checkInterval);
                resolve({menuRight, managerGroup: buttonGroups[buttonGroups.length - 1]});
              }
            }
          }, 100);
        });
      };

      const {menuRight, managerGroup} = await waitForButtonGroup();
      
      // 创建"保存工作流"SVG图标按钮
      const saveButton = document.createElement("button");
      saveButton.id = "workflow-save-button";
      saveButton.className = "comfyui-button"; // 使用ComfyUI的标准按钮类
      saveButton.title = "保存当前工作流"; // 添加tooltip
      saveButton.setAttribute("aria-label", "保存当前工作流");
      saveButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      `;
      saveButton.style.display = "flex";
      saveButton.style.alignItems = "center";
      saveButton.style.justifyContent = "center";
      saveButton.style.padding = "6px";
      saveButton.style.color = "white"; 
      saveButton.style.border = "none";
      saveButton.style.borderRadius = "4px";
      saveButton.style.backgroundColor = "#11998e";
      saveButton.style.margin = "0 5px";
      
      // 鼠标悬停效果
      saveButton.addEventListener("mouseover", () => {
        saveButton.style.backgroundColor = "#0d7d74";
      });
      saveButton.addEventListener("mouseout", () => {
        saveButton.style.backgroundColor = "#11998e";
      });
      
      // 创建"查询工作流"SVG图标按钮
      const queryButton = document.createElement("button");
      queryButton.id = "workflow-query-button";
      queryButton.className = "comfyui-button"; // 使用ComfyUI的标准按钮类
      queryButton.title = "查询保存的工作流"; // 添加tooltip
      queryButton.setAttribute("aria-label", "查询保存的工作流");
      queryButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6"></path>
          <path d="M14 3v5h5M18 16l4 4m-4 0l4-4"></path>
          <circle cx="12" cy="16" r="4"></circle>
        </svg>
      `;
      queryButton.style.display = "flex";
      queryButton.style.alignItems = "center";
      queryButton.style.justifyContent = "center";
      queryButton.style.padding = "6px";
      queryButton.style.color = "white"; 
      queryButton.style.border = "none";
      queryButton.style.borderRadius = "4px";
      queryButton.style.backgroundColor = "#43cea2";
      queryButton.style.margin = "0 5px";
      
      // 鼠标悬停效果
      queryButton.addEventListener("mouseover", () => {
        queryButton.style.backgroundColor = "#3ab48c";
      });
      queryButton.addEventListener("mouseout", () => {
        queryButton.style.backgroundColor = "#43cea2";
      });
      
      // 点击事件
      saveButton.onclick = () => {
        if (!workflowManagerInstance) {
          workflowManagerInstance = new WorkflowManager();
        }
        workflowManagerInstance.showSaveWorkflowDialog();
      };
      
      queryButton.onclick = () => {
        if (!workflowManagerInstance) {
          workflowManagerInstance = new WorkflowManager();
        }
        workflowManagerInstance.showWorkflowListDialog();
      };
      
      // 将按钮添加到包含Manager按钮的按钮组中，并放在Manager按钮前面
      const managerButton = managerGroup.querySelector('button[title="ComfyUI Manager"]');
      if (managerButton) {
        managerGroup.insertBefore(saveButton, managerButton);
        managerGroup.insertBefore(queryButton, managerButton);
      } else {
        // 如果找不到Manager按钮，就直接添加到按钮组中
        managerGroup.appendChild(saveButton);
        managerGroup.appendChild(queryButton);
      }
      
      console.log("已添加工作流管理器按钮到ComfyUI Manager按钮前面");
    } catch (error) {
      console.error("添加工作流管理器按钮失败:", error);
    }
  }
}); 