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
            "workflow": workflow_data
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
        
        return web.json_response({"status": "success", "workflow": data.get("workflow")})
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
            
        # 解析工作流数据 - 直接获取ComfyUI格式的工作流
        try:
            workflow_data = workflow_meta.get("workflow", "{}")
            if isinstance(workflow_data, str):
                # 如果存储为字符串，需要解析为JSON
                workflow_json = json.loads(workflow_data)
            else:
                # 如果已经是JSON对象，直接使用
                workflow_json = workflow_data
        except Exception as e:
            print(f"[Workflow Manager] 工作流数据格式错误: {e}")
            return web.json_response({
                "status": "error", 
                "message": f"工作流数据格式不正确: {str(e)}"
            })
        
        if not workflow_json or not isinstance(workflow_json, dict):
            return web.json_response({
                "status": "error", 
                "message": "工作流数据为空或格式不正确"
            })
        
        # 获取请求参数
        data = await request.json()
        params = data.get("params", {})
        
        if not params:
            return web.json_response({
                "status": "error", 
                "message": "未提供参数"
            })
        
        # 创建工作流副本，以便修改
        modified_workflow = copy.deepcopy(workflow_json)
        
        # 执行前端格式到API格式的转换
        print(f"[Workflow Manager] 转换前端格式工作流到API格式")
        api_format = {}
        
        # 处理节点 - 从数组转换为{id: node}的对象格式
        if "nodes" in modified_workflow and isinstance(modified_workflow["nodes"], list):
            for node in modified_workflow["nodes"]:
                if "id" not in node:
                    continue
                
                node_id = str(node["id"])
                
                # 创建API节点基本结构
                api_format[node_id] = {
                    "class_type": node.get("type", ""),
                    "inputs": {}
                }
                
                # 添加标题元数据
                if "title" in node:
                    api_format[node_id]["_meta"] = {
                        "title": node["title"]
                    }
                
                # 处理节点输入
                # 首先处理连接的输入
                if "inputs" in node and isinstance(node["inputs"], list):
                    for input_item in node["inputs"]:
                        if "name" not in input_item:
                            continue
                            
                        input_name = input_item["name"]
                        
                        # 处理连接
                        if "link" in input_item and input_item["link"] is not None:
                            link_id = input_item["link"]
                            # 查找连接信息
                            if "links" in modified_workflow and isinstance(modified_workflow["links"], list):
                                for link in modified_workflow["links"]:
                                    if link[0] == link_id:
                                        # 链接格式: [id, sourceId, sourceSlot, targetId, targetSlot, type]
                                        source_id = str(link[1])
                                        source_slot = link[2]
                                        api_format[node_id]["inputs"][input_name] = [source_id, source_slot]
                                        break
                
                # 处理widget值
                if "widgets_values" in node and isinstance(node["widgets_values"], list):
                    if "widgets" in node and isinstance(node["widgets"], list):
                        for i, widget in enumerate(node["widgets"]):
                            if "name" in widget and i < len(node["widgets_values"]):
                                widget_name = widget["name"]
                                # 如果没有连接输入，才使用widget值
                                if widget_name not in api_format[node_id]["inputs"]:
                                    api_format[node_id]["inputs"][widget_name] = node["widgets_values"][i]
                
                # 处理节点的输出（主要用于iyunya_in_类型的节点）
                if "outputs" in node and isinstance(node["outputs"], list) and node.get("type", "").startswith("iyunya_in_"):
                    api_format[node_id]["outputs"] = {}
                    for output_item in node["outputs"]:
                        if "name" in output_item:
                            output_name = output_item["name"]
                            # 复制输出的类型信息
                            output_type = output_item.get("type", "")
                            # 创建对应类型的默认值
                            default_value = None
                            if "widget" in output_item and isinstance(output_item["widget"], dict):
                                widget_data = output_item["widget"]
                                # 记录widget类型和配置，便于后续参数替换
                                api_format[node_id]["outputs"][output_name] = {
                                    "type": output_type,
                                    "widget": widget_data.get("name", ""),
                                    "value": widget_data.get("default", None)
                                }
                            else:
                                # 如果没有widget，使用简单的类型标记
                                api_format[node_id]["outputs"][output_name] = {
                                    "type": output_type,
                                    "value": None
                                }
        else:
            print(f"[Workflow Manager] 警告: 工作流没有节点数组或格式错误")
            return web.json_response({
                "status": "error", 
                "message": "工作流数据格式不正确: 缺少节点数组"
            })
        
        # 使用转换后的API格式
        nodes = api_format
        
        # 替换输入节点的值
        input_nodes_replaced = 0
        
        # 处理输入节点，应用参数
        for node_id, node in nodes.items():
            # 检查是否是iyunya输入节点
            node_type = node.get("class_type", "")
            if node_type.startswith("iyunya_in_"):
                print(f"[Workflow Manager] 找到输入节点: {node_type} (ID: {node_id})")
                
                # 处理outputs与参数key的匹配替换
                if "outputs" in node:
                    outputs = node["outputs"]
                    for output_name, output_data in outputs.items():
                        # 检查参数中是否有对应的键
                        if output_name in params:
                            param_value = params[output_name]
                            print(f"[Workflow Manager] 替换输出参数 {output_name}: {param_value}")
                            
                            # 将参数值赋给输出的value字段
                            if isinstance(output_data, dict) and "value" in output_data:
                                # 尝试对值进行类型转换
                                if "type" in output_data:
                                    output_type = output_data["type"].lower()
                                    if output_type == "number" or output_type == "int":
                                        try:
                                            output_data["value"] = int(param_value)
                                        except:
                                            try:
                                                output_data["value"] = float(param_value)
                                            except:
                                                output_data["value"] = 0
                                    elif output_type == "float":
                                        try:
                                            output_data["value"] = float(param_value)
                                        except:
                                            output_data["value"] = 0.0
                                    elif output_type == "boolean":
                                        if isinstance(param_value, str):
                                            output_data["value"] = "True" if param_value.lower() in ('true', 'yes', '1', 't', 'y') else "False"
                                        else:
                                            output_data["value"] = "True" if bool(param_value) else "False"
                                    else:
                                        # 默认为字符串
                                        output_data["value"] = str(param_value)
                                else:
                                    # 如果没有类型信息，直接赋值
                                    output_data["value"] = param_value
                            else:
                                # 直接替换整个输出数据
                                outputs[output_name] = param_value
                            
                            input_nodes_replaced += 1
                    
                    # 将outputs参数同时写入到inputs中，确保节点能获取到参数
                    if isinstance(node["outputs"], dict):
                        # 确保inputs字段存在
                        if "inputs" not in node:
                            node["inputs"] = {}
                            
                        for output_name, output_data in node["outputs"].items():
                            # 确定要写入的值
                            if isinstance(output_data, dict) and "value" in output_data:
                                # 提取值
                                output_value = output_data["value"]
                                # 跳过None值
                                if output_value is None:
                                    continue
                                    
                                # 将output的value写入input中相同名称的字段
                                node["inputs"][output_name] = output_value
                                print(f"[Workflow Manager] 将输出参数 {output_name}: {output_value} 写入到inputs中")
                            elif not isinstance(output_data, dict):
                                # 如果output_data本身就是一个值（不是字典），直接使用
                                node["inputs"][output_name] = output_data
                                print(f"[Workflow Manager] 将输出参数 {output_name}: {output_data} 直接写入到inputs中")
        
        if input_nodes_replaced == 0:
            print(f"[Workflow Manager] 未找到匹配的输入节点参数")
            return web.json_response({
                "status": "warning", 
                "message": "未找到匹配的输入节点参数，工作流将以原始参数执行"
            })
        
        # 使用API格式的工作流
        final_workflow = nodes
        
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
                "client_id": f"workflow_manager_{workflow_id}_{str(uuid.uuid4())[:8]}",
                "workflow_id": workflow_id,
                "workflow_name": workflow_meta.get("name", "Unknown")
            }
            
            # 提交到队列
            PromptServer.instance.prompt_queue.put((0, prompt_id, final_workflow, extra_data, valid[2]))
            print(f"[Workflow Manager] 工作流已提交到执行队列，ID: {prompt_id}, prompt: {json.dumps(final_workflow, ensure_ascii=False)}")
            
            return web.json_response({
                "status": "success", 
                "message": "工作流已提交执行",
                "prompt_id": prompt_id,
                "workflow_id": workflow_id,
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