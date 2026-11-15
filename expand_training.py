from pathlib import Path
import re

source = Path('第十周AI小组培训-讲解动画版.html')
out = Path('第十周AI小组培训-详细版.html')
html = source.read_text(encoding='utf-8')

def slide(category, title, cards, note=''):
    blocks = ''.join(f'<div class="card{(" yellowbg" if i == 0 else "")}"><h3>{heading}</h3><p>{text}</p></div>' for i, (heading, text) in enumerate(cards))
    foot = f'<p class="note small">{note}</p>' if note else ''
    return f'<section class="slide"><div class="top"><span>{category}</span><span>00</span></div><h2>{title}</h2><div class="grid">{blocks}</div>{foot}</section>\n'

def before(title, item):
    global html
    pattern = r'<section class="slide"><div class="top">[^\n]*?<h2>' + re.escape(title) + r'</h2>'
    matches = list(re.finditer(pattern, html))
    if len(matches) != 1:
        raise ValueError(f'anchor {title}: {len(matches)}')
    pos = matches[0].start()
    html = html[:pos] + item + html[pos:]

before('HTML、CSS、JavaScript 分别做什么？', slide('WEB / 前端边界','前端页面能做什么？',[
 ('页面内完成','浏览器可以显示内容、响应点击、修改当前页面；单文件作品适合学习和展示。'),
 ('需要额外条件','跨设备同步、多人共享或发送消息通常需要后端服务；仅有 HTML 文件不会自动具备这些能力。'),
 ('保存与刷新','页面上的临时状态可能在刷新后消失；要保留数据，必须设计存储方式并测试。'),
 ('网络依赖','引用在线字体、图片或脚本时，断网可能影响效果。交付时要检查依赖和打开环境。')]))
before('写需求时，先确定五个要素', slide('VIBE CODING / 功能拆解','把需求拆成可验证的功能',[
 ('列出操作','写出用户能够执行的动作，以及每个动作对应的页面反馈。'),
 ('补全状态','说明初始、输入中、成功与失败时页面分别显示什么。'),
 ('确定边界','明确无内容、重复操作和异常输入应如何处理，避免只描述理想流程。'),
 ('划定优先级','先完成必须具备的功能，再增加视觉细节和可选功能；每完成一项就进行检查。')]))
before('从生成结果到可运行文件', slide('VIBE CODING / 修改策略','怎样让一次修改更可控？',[
 ('限定改动范围','说明需要调整的页面区域、交互和期望行为，并提醒 AI 保留已有功能。'),
 ('要求解释变化','请 AI 说明修改的位置、理由和影响，并给出可以直接应用的完整内容或清晰补丁。'),
 ('保存可回退版本','修改前保存已有版本；改动后确认文件保存成功，再刷新浏览器。'),
 ('逐项回归测试','先测试新功能，再检查原有操作；出现问题时保留报错与重现步骤。')]))
before('Git 与项目版本', slide('VIBE CODING / 开发者工具','用浏览器开发者工具定位问题',[
 ('打开工具','在浏览器中按 F12；如快捷键不同，可从浏览器菜单打开开发者工具。'),
 ('查看 Console','控制台显示脚本错误和日志；记录报错文本、文件名与行号，再结合操作步骤分析。'),
 ('检查页面元素','使用元素面板查看标签、文字和生效的样式；临时调整可用于验证想法，刷新后通常会还原。'),
 ('反馈给 AI','整理预期、实际现象、完整报错及相关代码；先删除账号密码、令牌和个人信息。')]))
before('Skills 和 MCP 在协作中扮演什么角色？', slide('VIBE CODING / 实际操作','Git：记录一次可恢复的工作进展',[
 ('初始化仓库','打开项目文件夹中的终端，执行 git init；这会在当前目录创建 Git 仓库。'),
 ('查看状态','执行 git status，确认当前目录和待记录文件；检查是否包含无需提交的敏感信息。'),
 ('加入并提交','执行 git add index.html，再执行 git commit -m "完成初版"；提交前先保存文件。'),
 ('确认记录','执行 git log --oneline 查看提交；如首次提交提示身份未配置，按 Git 提示配置后重试。')], '这些命令要求设备已安装 Git。文件名应与项目中的实际文件一致。'))
before('从故事梗概写到可执行的脚本', slide('AIGC / 创作规划','动手前，先把作品边界定下来',[
 ('观众与目的','明确作品面向谁，希望观众理解或感受什么，确保内容选择服务于目标。'),
 ('长度与形式','确定目标时长、画幅比例和输出形式；检查使用平台对画面与文件格式的要求。'),
 ('资源与条件','盘点可用工具、素材来源和制作时间；估计各镜头生成与调整所需工作量。'),
 ('统一的视觉设定','确定画风、色彩、光线和角色外观，记录成简短设定，供各镜头复用。')]))
before('景别与运镜影响观众看到什么', slide('AIGC / 分镜制作','分镜表怎样真正用于制作？',[
 ('一行对应一个镜头','为每个镜头记录编号、预计时长、画面内容、角色动作和背景。'),
 ('交代视听信息','明确景别、镜头运动、对白、音效与字幕；没有某项时可留空。'),
 ('关联生成素材','记录需要的角色参考、场景参考与素材文件，便于生成、筛选和替换。'),
 ('在剪辑前检查','按顺序读一遍镜头；核对事件顺序、人物位置与时间总长是否符合目标。')]))
before('如何让同一角色贯穿多个镜头？', slide('AIGC / 迭代方法','一次只调整影响结果的关键条件',[
 ('先选检查重点','对照分镜，从主体、动作、场景、风格和镜头中找出最影响理解的问题。'),
 ('修改对应描述','明确要改变的内容与保留的内容，避免每次同时改动太多条件。'),
 ('对照版本筛选','保留可用结果和对应提示词，比较修改前后差异，再决定是否继续调整。'),
 ('承认工具差异','不同工具支持的参考图、参数和生成方式不同；以实际界面和生成效果为准。')]))
before('课堂练习与课后提交', slide('AIGC / 剪辑与交付','交片前的最后检查',[
 ('画面和节奏','完整播放，检查镜头顺序、切换、时长及关键内容是否清楚。'),
 ('字幕与声音','核对字幕内容、停留时间和可读性；试听对白、音乐和音效的音量关系。'),
 ('导出与复查','按要求选择格式和画幅，导出后重新打开文件，确认画面、声音及首尾完整。'),
 ('整理交付材料','保留视频、主要分镜稿和必要素材记录；确认文件可打开、名称清晰。')]))
html = html.replace('交互可以拆成三件事','交互可以拆成四个环节').replace('写需求时，先确定五个要素','写需求时，先确定四类信息')
# Keep existing section labels consistent after inserts.
idx = 0
def renumber(match):
    global idx
    n = idx
    idx += 1
    if n == 0: return match.group(0)
    return re.sub(r'(<span>)\d{2}(</span></div>)', lambda m: m.group(1)+f'{n:02d}'+m.group(2), match.group(0), count=1)
html = re.sub(r'<section class="slide"><div class="top">.*?</div>', renumber, html)
html = html.replace('AI 小组培训 · 讲解动画版','AI 小组培训 · 详细版')
out.write_text(html, encoding='utf-8')
print('slides:', idx, 'bytes:', out.stat().st_size)
