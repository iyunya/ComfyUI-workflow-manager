import os
import json
import traceback
import uuid
from datetime import datetime
from server import PromptServer
from aiohttp import web
import copy
import execution

# 导入工作流存储路径
WORKFLOWS_DIR = "workflow_saves"

# 生成短UUID函数
def generate_short_uuid():
    return str(uuid.uuid4())[:8]

# 设置API路由
@PromptServer.instance.routes.post("/api/workflow/save")
async def save_workflow(request):
    try:
        data = await request.json()
        name = data.get("name", "").strip()
        description = data.get("description", "").strip()
        workflow_data = data.get("workflow", "")
        workflow_id = data.get("id")
        api_data = data.get("api", "")  # 获取API数据
        
        # 如果没有提供ID或ID为空，生成短UUID
        if not workflow_id:
            workflow_id = generate_short_uuid()
        
        if not name:
            return web.json_response({"status": "error", "message": "工作流名称不能为空"})
        
        if not workflow_data:
            return web.json_response({"status": "error", "message": "工作流数据不能为空"})
        
        # 检查保存目录是否存在
        if not os.path.exists(WORKFLOWS_DIR):
            os.makedirs(WORKFLOWS_DIR, exist_ok=True)
        
        # 构建文件路径
        file_path = os.path.join(WORKFLOWS_DIR, f"{workflow_id}.json")
        
        # 检查文件是否已存在
        is_update = os.path.exists(file_path)
        
        # 构建工作流元数据
        current_time = datetime.now().isoformat()
        
        # 如果是更新现有工作流，尝试保留原始创建时间
        created_at = current_time
        if is_update:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                    created_at = existing_data.get("created_at", current_time)
            except:
                # 如果读取失败，使用当前时间作为创建时间
                pass
        
        workflow_meta = {
            "id": workflow_id,
            "name": name,
            "description": description,
            "created_at": created_at,
            "updated_at": current_time,
            "workflow": workflow_data,
            "api": api_data
        }
        
        # 保存到文件
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(workflow_meta, f, ensure_ascii=False, indent=2)
        
        action = "更新" if is_update else "保存"
        print(f"[Workflow Manager] {action}工作流到: {file_path}")
        
        return web.json_response({
            "status": "success", 
            "message": f"工作流{action}成功",
            "workflow_id": workflow_id
        })
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[Workflow Manager] 保存工作流失败: {e}\n{error_trace}")
        return web.json_response({"status": "error", "message": f"保存失败: {str(e)}"})


@PromptServer.instance.routes.get("/api/workflow/list")
async def list_workflows(request):
    try:
        print(f"[Workflow Manager] 获取工作流列表, 目录: {WORKFLOWS_DIR}")
        workflows = []
        
        # 确保目录存在
        if not os.path.exists(WORKFLOWS_DIR):
            print(f"[Workflow Manager] 工作流目录不存在，创建: {WORKFLOWS_DIR}")
            os.makedirs(WORKFLOWS_DIR, exist_ok=True)
            # 返回空列表而不是错误
            return web.json_response({"status": "success", "workflows": []})
        
        # 读取所有工作流文件
        for file in os.listdir(WORKFLOWS_DIR):
            if file.endswith(".json"):
                file_path = os.path.join(WORKFLOWS_DIR, file)
                try:
                    print(f"[Workflow Manager] 读取工作流文件: {file_path}")
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        # 省略工作流数据以减小响应大小
                        workflows.append({
                            "id": data.get("id"),
                            "name": data.get("name"),
                            "description": data.get("description"),
                            "created_at": data.get("created_at"),
                            "updated_at": data.get("updated_at")
                        })
                except Exception as e:
                    error_trace = traceback.format_exc()
                    print(f"[Workflow Manager] 读取工作流文件出错 {file_path}: {e}\n{error_trace}")
        
        # 按照创建时间排序，最新的放在前面
        workflows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        print(f"[Workflow Manager] 找到 {len(workflows)} 个工作流")
        return web.json_response({"status": "success", "workflows": workflows})
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[Workflow Manager] 获取工作流列表失败: {e}\n{error_trace}")
        # 返回带详细错误的JSON格式响应
        return web.json_response({
            "status": "error", 
            "message": f"获取工作流列表失败: {str(e)}",
            "detail": error_trace
        })


@PromptServer.instance.routes.get("/api/workflow/get/{workflow_id}")
async def get_workflow(request):
    workflow_id = request.match_info.get("workflow_id", "")
    try:
        print(f"[Workflow Manager] 获取工作流: {workflow_id}")
        file_path = os.path.join(WORKFLOWS_DIR, f"{workflow_id}.json")
        
        if not os.path.exists(file_path):
            print(f"[Workflow Manager] 工作流不存在: {file_path}")
            return web.json_response({"status": "error", "message": f"工作流不存在: {workflow_id}"})
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        response_data = {
            "status": "success", 
            "workflow": data.get("workflow"),
            "api": data.get("api")
        }
        
        return web.json_response(response_data)
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[Workflow Manager] 获取工作流失败: {e}\n{error_trace}")
        return web.json_response({"status": "error", "message": f"获取工作流失败: {str(e)}"})


@PromptServer.instance.routes.delete("/api/workflow/delete/{workflow_id}")
async def delete_workflow(request):
    workflow_id = request.match_info.get("workflow_id", "")
    try:
        print(f"[Workflow Manager] 删除工作流: {workflow_id}")
        file_path = os.path.join(WORKFLOWS_DIR, f"{workflow_id}.json")
        
        if not os.path.exists(file_path):
            print(f"[Workflow Manager] 要删除的工作流不存在: {file_path}")
            return web.json_response({"status": "error", "message": f"工作流不存在: {workflow_id}"})
        
        # 删除文件
        os.remove(file_path)
        print(f"[Workflow Manager] 工作流已删除: {workflow_id}")
        
        return web.json_response({"status": "success", "message": "工作流删除成功"})
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[Workflow Manager] 删除工作流失败: {e}\n{error_trace}")
        return web.json_response({"status": "error", "message": f"删除工作流失败: {str(e)}"})


@PromptServer.instance.routes.post("/api/workflow/execute/{workflow_id}")
async def execute_workflow_with_params(request):
    workflow_id = request.match_info.get("workflow_id", "")
    try:
        print(f"[Workflow Manager] 执行工作流: {workflow_id}")
        file_path = os.path.join(WORKFLOWS_DIR, f"{workflow_id}.json")
        
        if not os.path.exists(file_path):
            print(f"[Workflow Manager] 工作流不存在: {file_path}")
            return web.json_response({"status": "error", "message": f"工作流不存在: {workflow_id}"})
        
        # 读取工作流数据
        with open(file_path, "r", encoding="utf-8") as f:
            workflow_meta = json.load(f)
        
        # 获取请求参数
        data = await request.json()
        params = data.get("params", {})
        client_id = data.get("client_id", f"workflow_manager_{workflow_id}_{str(uuid.uuid4())[:8]}")
        
        if not params:
            print(f"[Workflow Manager] 未提供参数，将使用工作流原始参数执行")
        
        # 检查是否有API数据
        api_data = None
        if "api" in workflow_meta and workflow_meta["api"]:
            try:
                if isinstance(workflow_meta["api"], str):
                    api_data = json.loads(workflow_meta["api"])
                else:
                    api_data = workflow_meta["api"]
                print(f"[Workflow Manager] 已找到API Schema，将直接使用API数据执行")
            except Exception as e:
                print(f"[Workflow Manager] API数据解析失败: {e}")
                api_data = None
        
        
        # 深度复制API数据，避免修改原始数据
        final_workflow = copy.deepcopy(api_data)
        
        # 替换iyunya_in_节点的输入参数
        input_nodes_replaced = 0
        
        for node_id, node in final_workflow.items():
            if node.get("class_type", "").startswith("iyunya_in_"):
                print(f"[Workflow Manager] 在API数据中找到输入节点: {node['class_type']} (ID: {node_id})")
                
                # 确保inputs字段存在
                if "inputs" not in node:
                    node["inputs"] = {}
                
                # 替换参数
                for param_name, param_value in params.items():
                    # 直接替换input中的参数，不考虑类型转换
                    if param_value is not None:  # 跳过None值
                        node["inputs"][param_name] = param_value
                        print(f"[Workflow Manager] 替换API参数 {param_name}: {param_value}")
                        input_nodes_replaced += 1
        
        print(f"[Workflow Manager] API工作流参数替换完成，共替换 {input_nodes_replaced} 个参数")
        
        # 将修改后的工作流提交到ComfyUI执行队列
        try:
            # 生成唯一的prompt ID
            prompt_id = str(uuid.uuid4())
            
            # 直接使用ComfyUI的API接口提交工作流
            # 注意：这里不能直接调用PromptServer.instance.prompt_queue.put，
            # 而是应该使用正规的API调用方式，通过post_prompt函数
            
            valid = execution.validate_prompt(final_workflow)
            if not valid[0]:
                print(f"[Workflow Manager] 工作流验证失败: {valid[1]}")
                return web.json_response({
                    "status": "error", 
                    "message": f"工作流验证失败: {valid[1]}",
                    "node_errors": valid[3]
                })
            
            # 准备执行数据
            extra_data = {
                "client_id": client_id,
                "workflow_id": workflow_id,
                "workflow_name": workflow_meta.get("name", "Unknown")
            }
            
            # 提交到队列
            PromptServer.instance.prompt_queue.put((0, prompt_id, final_workflow, extra_data, valid[2]))
            print(f"[Workflow Manager] 工作流已提交到执行队列，ID: {prompt_id}, client_id: {client_id}")
            
            return web.json_response({
                "status": "success", 
                "message": "工作流已提交执行",
                "prompt_id": prompt_id,
                "workflow_id": workflow_id,
                "client_id": client_id,
                "replaced_params_count": input_nodes_replaced
            })
            
        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"[Workflow Manager] 提交工作流到执行队列失败: {e}\n{error_trace}")
            return web.json_response({
                "status": "error", 
                "message": f"提交工作流到执行队列失败: {str(e)}"
            })
            
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[Workflow Manager] 执行工作流失败: {e}\n{error_trace}")
        return web.json_response({
            "status": "error", 
            "message": f"执行工作流失败: {str(e)}",
            "detail": error_trace
        }) 