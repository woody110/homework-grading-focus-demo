// ---- 共享数据与工具函数：列表页与学生详情弹窗共用（学生详情由独立页面收编回列表页内嵌弹窗） ----
const now = Date.now();
const DAY = 86400000;
function tsOf(daysAgo){ return now - daysAgo * DAY; }
function fmtTime(ts){
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// tier: 'A' | 'B' —— 学生分层，学生级属性；同一学生（name+cls）的多条 case 需保持一致取值
// level: 'l3' | 'l2' | 'ghost' | 'weak' | 'good' —— 仅用于视觉严重度配色（红/紫/橙/绿）与行高亮，不参与优先级排序；教师侧展示文案见 perfLabel
// priority: 'urgent' | 'high' | 'mid' —— 对应《学期关注任务规则表》的紧急/高/中三档，逐条标签类型赋值，决定排序权重（见 casePriority）与"紧急"角标展示，不再依赖 level
// filterKey: 对应筛选下拉的具体标签类型选项，按二级任务命名空间前缀区分——hw-*(作业表现) / essay-*(作文批改) / ability-*(能力变化)，同名标签在不同二级任务下 filterKey 不同（如 hw-risk-high 与 essay-risk-high）
// 【2026-09-16】筛选与展示已按《AI教辅智能任务体系-学期关注任务规则表.md》重新对齐：风险类信号按 sourceType 归入具体二级任务（sourceType=校内作文 → 作文批改，其余 → 作业表现），星级/精选类信号一律归入作业表现（作文批改的星级规则尚未定义），学情档案类信号一律归入能力变化；「子能力」提升/下降为单次判定，持续优秀/持续薄弱为连续3次同向判定，[[子能力提升/下降数据来源修正]]
// perfLabel: 列表/详情实际展示的具体重点表现文案，统一带二级任务前缀（作业表现·/作文批改·/能力变化·），含子能力名称时使用「」标注
// category: 'risk' | 'weak' | 'good' —— 对应统计卡片口径（4.5节）；风险类含情绪风险与疑似AI代写两个 subtype
// assignmentTitle: 来源于同一份作业提交的 case 用此字段标记，详情卡片时间轴据此分组聚合；学情类 case（含单次子能力判定、跨多次提交的趋势）均不设置此字段，因数据来源学情档案，不锚定于某一份作业
// sourceType: 该次触发的来源渠道——课后作业/校内作文/阅读宝典/试卷批改等，随 assignmentTitle 一同标记，时间轴上每组仅展示一次；同时也是风险类信号归属二级任务的判定依据
// timingAdvice/channelAdvice/scriptAdvice: 反馈建议模块的三个固定子模块——沟通时机建议/沟通方式建议/沟通话术策略建议
const data = [
  {
    name:"若宸", cls:"八上9-1班", phone:"13812342201", tier:"A", level:"l3", filterKey:"essay-risk-high", perfLabel:"作文批改·风险·高风险",
    category:"risk", subtype:"emotion", priority:"urgent", isNew:true, daysAgo:0,
    assignmentTitle:"《长大以后》", sourceType:"校内作文",
    reason:"作文《长大以后》中出现明显负面情绪与自我否定表达，需高度关注",
    evidence:"本次作文《长大以后》被判定为「高风险」，文中出现自我否定与绝望感表达，原文是：\"我觉得自己一直在拖累大家，有时候真的很想消失，什么都不用管了。\"",
    status:"pending",
    copy:null,
    points:["建议先私下与孩子沟通，了解具体情况，避免在书面反馈中直接提及具体表达内容","建议优先电话联系家长而非文字沟通，语气尽量委婉","请老师结合平时观察自行判断严重程度，并决定后续处理方式"],
    warn:"该条为高风险信息，系统仅给出沟通建议要点，请老师自行判断并处理。已同步教研/心理角色纳入周期性复核队列。",
    timingAdvice:"高风险信息建议尽快在24小时内沟通，避免拖延；具体时段建议避开孩子在场场合，选择家长独处、方便接听电话的时间。",
    channelAdvice:"建议优先电话沟通而非文字消息，语气与措辞更易把控，也能第一时间感知家长反应；暂无该生历史沟通记录可参考，建议本次沟通后补充记录。",
    scriptAdvice:"仅供沟通思路参考：先了解近期是否有特殊情况，再委婉带出观察到的表达，避免直接引用原文刺激家长情绪。",
    secondaryDims:[
      {filterKey:"ability-weak-streak", level:"weak", perfLabel:"能力变化·「情感感知」持续薄弱", priority:"high", reason:"「情感感知」能力近期连续3次待提升"}
    ],
    followUps:[]
  },
  {
    name:"若宸", cls:"八上9-1班", phone:"13812342201", tier:"A", level:"weak", filterKey:"hw-4star", perfLabel:"作业表现·四星待提升",
    category:"weak", priority:"mid", isNew:true, daysAgo:0,
    assignmentTitle:"《长大以后》", sourceType:"校内作文",
    reason:"本次作文《长大以后》获评「四星」，结构组织完整但情感感知偏单薄",
    evidence:"本次作文《长大以后》获评「四星」，建议：整体结构组织完整，但情感感知偏单薄，原文是：\"长大以后我想做一名普通的上班族，每天按时上下班就好。\"",
    status:"pending",
    copy:"这次作文孩子写得中规中矩，被评为「四星」，情感感知部分可以再丰富一些。建议家长和孩子聊聊对未来的具体想法，帮孩子把感受写得更细腻一点～",
    points:["与本次风险类任务同属一份作业，建议合并安排沟通节奏，避免同一天多次联系家长","单次「四星」评价本身无需过度强调，可在风险沟通之后视情况提及"],
    timingAdvice:"与同一份作业下的高风险任务合并处理，不单独占用一次沟通时机，避免家长短时间内被多次联系。",
    channelAdvice:"建议在处理完风险沟通后，视情况通过文字消息顺带提及即可，无需单独致电；暂无该生历史沟通记录可参考。",
    scriptAdvice:"可作为风险沟通结束后的补充话题，简单提及本次作文评级与可提升方向，不作为独立话术展开。",
    followUps:[]
  },
  {
    name:"啸铭", cls:"八上8-2班", phone:"13934564407", tier:"B", level:"l2", filterKey:"hw-risk-low", perfLabel:"作业表现·风险·低风险",
    category:"risk", subtype:"emotion", priority:"mid", isNew:false, daysAgo:1,
    assignmentTitle:"《我的语文小结》", sourceType:"阅读宝典",
    reason:"本次作文《我的语文小结》中出现消极自我评价（\"我什么都写不好\"），建议关注",
    evidence:"本次作文《我的语文小结》被判定为「低风险」，出现消极自我评价，原文是：\"我怎么都写不好，感觉自己写作文就是不行。\"",
    status:"pending",
    copy:"这次作业里，感觉到孩子对自己的要求有点高，可能因为这次没写好有些沮丧。建议家长这两天多和孩子聊聊学习之外的事，肯定一下他的努力，帮他缓解一下压力～",
    points:["措辞已刻意放缓，避免加重孩子的负面情绪","建议老师先私下确认情况后，再决定是否发送给家长","可结合该生历史表现，判断是否为偶发情绪"],
    timingAdvice:"低风险信息建议在3天内沟通即可，不必占用当天时间，可结合下次自然沟通节点一并提及。",
    channelAdvice:"建议以文字消息为主，语气委婉即可；暂无该生历史沟通记录可参考，建议本次沟通后补充记录以便后续判断是否偶发。",
    scriptAdvice:"可参考建议措辞直接沟通，也可结合老师自己对该生的了解调整措辞后再发送。",
    followUps:[]
  },
  {
    name:"啸铭", cls:"八上8-2班", phone:"13934564407", tier:"B", level:"weak", filterKey:"ability-down", perfLabel:"能力变化·「细节捕捉」下降",
    category:"weak", priority:"mid", isNew:true, daysAgo:0,
    reason:"学情档案单次判定「细节捕捉」子能力较此前出现下降",
    evidence:"学情档案基于历史题型统计，本次将「细节捕捉」子能力判定为「下降」，建议：细节描写偏笼统，缺少具体动作或感官描写；参考近期一次作文片段：\"暑假我去了外婆家，玩得很开心，吃了很多好吃的。\"",
    status:"pending",
    copy:"这次作业里，孩子在细节捕捉这部分还可以再具体一些，建议家长和孩子一起看看能不能把观察到的东西写得更清楚一点～",
    points:["较此前出现下降，建议先观察下次表现再判断是否需要持续跟进","可结合孩子平时的写作习惯，给出具体练习方向","与该生同期的风险类任务分别独立处理，不合并判断"],
    timingAdvice:"非紧急类反馈，建议在近期常规沟通中一并提及，不必单独安排时机。",
    channelAdvice:"建议以文字消息为主；暂无该生历史沟通记录可参考，可结合本次风险类任务的沟通结果综合判断整体沟通频率是否合适。",
    scriptAdvice:"可参考建议措辞作为反馈基础，视情况调整语气。",
    secondaryDims:[
      {filterKey:"ability-up", level:"good", perfLabel:"能力变化·「结构组织」提升", priority:"mid", reason:"学情档案单次判定「结构组织」子能力较此前出现提升"}
    ],
    followUps:[]
  },
  {
    name:"张梓萱", cls:"八上9-1班", phone:"13678907723", tier:"A", level:"weak", filterKey:"ability-weak-streak", perfLabel:"能力变化·「字面理解」持续薄弱",
    category:"weak", priority:"high", isNew:true, daysAgo:0,
    reason:"近1个月「字面理解」能力连续3次待提升，且呈下降趋势",
    evidence:"「字面理解」能力子维度连续3次被判定为「尚未达到」（连续1次→2次→3次待提升，本次续期更新，非重复新建），本次原句是：\"因为下雨的原因，所以导致运动会取消了。\"，判定理由：滥用关联词导致语义重复。",
    status:"pending",
    renewNote:"同一薄弱项已连续续期 3 次（连续1次→2次→3次待提升），非重复新建任务",
    copy:"最近几次作业里，孩子在字面理解这部分一直有些吃力，这段时间还出现了一点下滑。建议这段时间家长可以多留意一下这部分的练习，如果需要，我们也可以一起商量下针对性的巩固方式～",
    points:["强调\"连续\"而非单次失误，避免家长误解为孩子不用心","邀请家长共同参与，而非单向告知问题","建议附上近期的对比数据，增强说服力"],
    timingAdvice:"持续3次薄弱建议尽快沟通，避免继续积累；建议选择家长相对空闲的晚间时段。",
    channelAdvice:"建议电话沟通，便于说明\"连续\"这一趋势并解答家长疑问；暂无该生历史沟通记录可参考。",
    scriptAdvice:"沟通时建议附上近期3次的对比数据增强说服力。",
    followUps:[]
  },
  {
    name:"陈奕帆", cls:"八上8-2班", phone:"13723455561", tier:"B", level:"weak", filterKey:"ability-weak-streak", perfLabel:"能力变化·「整体感知」持续薄弱",
    category:"weak", priority:"high", isNew:false, daysAgo:2,
    reason:"近1个月「整体感知」连续3次待提升",
    evidence:"「整体感知」能力子维度连续3次被判定为「尚未达到」，本次判定理由：概括内容遗漏关键信息，仅复述局部情节。",
    status:"done",
    copy:"孩子在把握文章整体主旨这部分还需要多练习，建议家长平时可以引导孩子读完一段话后，试着用一句话说说讲了什么，帮孩子养成提炼要点的习惯。",
    points:["可结合课内阅读作业，给出具体练习方法","建议每周跟进一次效果"],
    timingAdvice:"已于近期沟通并约定两周后复查效果，建议按约定时间跟进，无需提前打扰。",
    channelAdvice:"此前采用电话沟通效果良好，建议后续跟进延续电话方式，便于家长同步反馈孩子在家表现。",
    scriptAdvice:"跟进时可直接回顾此前约定内容，询问陪读进展与孩子近期表现变化。",
    followUps:[
      {text:"已和家长电话沟通，家长表示会在家增加陪读时间，约定两周后再看效果。", by:"吴立明", ts: tsOf(1)}
    ]
  },
  {
    name:"李知遥", cls:"八上9-1班", phone:"13556789082", tier:"A", level:"weak", filterKey:"ability-down", perfLabel:"能力变化·「字面理解」下降",
    category:"weak", priority:"mid", isNew:true, daysAgo:0,
    reason:"学情档案单次判定「字面理解」子能力较此前出现下降",
    evidence:"学情档案基于历史题型统计，本次将「字面理解」子能力判定为「下降」；参考近期一次作文原句：\"通过这次活动，使我懂得了团结的重要性。\"，判定理由：主语残缺，滥用介词导致句子成分缺失。",
    status:"pending",
    copy:"这次作业里，孩子在字面理解这部分还需要多留意，建议家长可以陪孩子一起读一读、改一改，帮孩子巩固一下这部分～",
    points:["较此前出现下降，建议先观察下次表现再判断是否需要持续跟进","可结合课内练习给出具体巩固方法"],
    timingAdvice:"非紧急类反馈，建议结合近期常规沟通节点一并提及。",
    channelAdvice:"建议以文字消息为主；暂无该生历史沟通记录可参考。",
    scriptAdvice:"可参考建议措辞沟通，同时可提及「原创表达」子能力的进步以平衡语气。",
    secondaryDims:[
      {filterKey:"ability-up", level:"good", perfLabel:"能力变化·「原创表达」提升", priority:"mid", reason:"学情档案单次判定「原创表达」子能力较此前出现提升"}
    ],
    followUps:[]
  },
  {
    name:"周予安", cls:"八上9-1班", phone:"13345676650", tier:"B", level:"good", filterKey:"ability-good-streak", perfLabel:"能力变化·「原创表达」持续优秀",
    category:"good", priority:"high", isNew:false, daysAgo:3,
    reason:"「原创表达」能力连续3次表现优秀，建议转为习惯培养类反馈",
    evidence:"「原创表达」能力子维度连续3次被判定为高于本年级预期。本次判定理由：叙事结构完整，比喻使用恰当。",
    status:"pending",
    copy:"孩子最近几次的作文都写得很棒，思路清晰、用词也越来越准确，能感觉到他在写作上真的很用心。建议家长在生活中也可以多鼓励孩子写写日记或小随笔，让这份热爱持续下去～",
    points:["连续优秀建议弱化\"表扬\"，转向\"习惯养成\"角度，避免边际效应递减","可以给出具体的延伸建议（如日记、随笔）"],
    timingAdvice:"表扬类反馈无需紧急处理，建议选择轻松的沟通场景，如放学接送时顺口提及。",
    channelAdvice:"建议文字消息即可，轻松、不占用家长过多时间；暂无该生历史沟通记录可参考。",
    scriptAdvice:"语气建议偏日常化，避免过于正式。",
    followUps:[]
  },
  {
    name:"沈知微", cls:"八上8-2班", phone:"13123452298", tier:"A", level:"good", filterKey:"hw-5star-streak", perfLabel:"作业表现·连续五星",
    category:"good", priority:"high", isNew:true, daysAgo:0,
    assignmentTitle:"《一件难忘的小事》", sourceType:"校内作文",
    reason:"近3次作文（含本次《一件难忘的小事》）连续获评「五星」，细节描写持续生动，建议肯定鼓励并保持",
    evidence:"《一件难忘的小事》等近3次作文连续获评「五星」（连续1次→2次→3次，本次续期更新，非重复新建），细节描写持续生动，本次原文是：\"外婆的手粗糙得像老树皮，可是每次她把我的手包在里面，我都觉得特别安心。\"",
    status:"pending",
    renewNote:"同一「五星」表现已连续续期 3 次（连续1次→2次→3次），非重复新建任务",
    copy:"孩子最近三次作文都被评为「五星」，尤其是细节描写一直让人印象深刻，能感觉到平时观察生活很用心。建议家长趁热问问孩子创作时的想法，让这份用心被看见；也可以让孩子把这几篇作文念给家人听，增强一下成就感～",
    points:["连续三次高分表现，建议弱化\"单次表扬\"，转向肯定这份稳定的水平","可结合孩子平时的阅读积累，鼓励保持这个状态","与「能力变化」维度的持续优秀趋势不同，这是同一份「作业表现」的连续亮点，措辞上可以体现\"持续稳定\"而非\"惊喜式\"表扬"],
    timingAdvice:"连续三次表扬类反馈建议趁热尽快沟通，让孩子的成就感能被及时看见。",
    channelAdvice:"建议文字消息即可，附上原文片段更有说服力；暂无该生历史沟通记录可参考。",
    scriptAdvice:"建议附上原文中的细节描写片段增强真实感。",
    followUps:[]
  },
  {
    name:"陆亦臻", cls:"八上9-1班", phone:"18934563345", tier:"B", level:"good", filterKey:"hw-select", perfLabel:"作业表现·精选佳作",
    category:"good", priority:"mid", isNew:false, daysAgo:0,
    assignmentTitle:"《一件难忘的小事》", sourceType:"校内作文",
    reason:"本次作文《一件难忘的小事》获评「精选」，立意新颖、语言老练，为本次作业最高等级评价",
    evidence:"本次作文《一件难忘的小事》获评本次作业最高等级「精选」，立意新颖、语言老练，比五星更进一步，原文是：\"时间从不回头，它只是把没说完的话，都酿成了往后的沉默。\"",
    status:"pending",
    copy:"这次作文孩子写得非常出色，被评为本次作业里最高等级的「精选」，立意和语言表达都超出了这个年龄段的水平。建议家长好好表扬一下孩子，也可以把这篇作文留存下来，作为一个值得纪念的进步节点～",
    points:["「精选」是单次作业的最高评级，比「五星」更进一步，表扬时建议体现出这份特别","可以鼓励孩子分享写作思路，激发持续创作的兴趣","若该生后续多次维持这一水平，将计入「学情」维度的持续优秀趋势，不与本次单次亮点重复计入"],
    timingAdvice:"表扬类反馈建议趁热尽快沟通，体现对孩子这次特别表现的重视。",
    channelAdvice:"建议文字消息为主，可考虑附上作文片段供家长留存；暂无该生历史沟通记录可参考。",
    scriptAdvice:"建议强调「精选」为本次作业最高等级这一稀缺性。",
    followUps:[]
  },
  {
    name:"沈昱", cls:"八上8-2班", phone:"18645677712", tier:"A", level:"weak", filterKey:"hw-4star", perfLabel:"作业表现·四星待提升",
    category:"weak", priority:"mid", isNew:false, daysAgo:0,
    assignmentTitle:"《我的老师》", sourceType:"校内作文",
    reason:"本次作文《我的老师》获评「四星」，建议关注是否需要巩固",
    evidence:"本次作文《我的老师》获评「四星」，建议：结构完整但结尾略显仓促，原文结尾是：\"老师对我们很好，我很喜欢她，就这样吧。\"",
    status:"pending",
    copy:"这次作文孩子写得还不错，被评为「四星」，主要是结尾部分可以再展开一点。建议家长可以和孩子聊聊，想想结尾还能加点什么感受或细节，让整篇文章更完整～",
    points:["单次「四星」评价，建议先观察是否偶发，不必过度强调","可引导孩子在结尾处多写一两句真实感受"],
    timingAdvice:"非紧急类反馈，建议结合近期常规沟通节点一并提及。",
    channelAdvice:"建议文字消息即可；暂无该生历史沟通记录可参考。",
    scriptAdvice:"语气亲和肯定即可，无需过多修饰。",
    followUps:[]
  },
  {
    name:"何雨橙", cls:"八上9-1班", phone:"15278904489", tier:"B", level:"ghost", filterKey:"essay-ghost", perfLabel:"作文批改·疑似AI代写",
    category:"risk", subtype:"ghost", priority:"high", isNew:true, daysAgo:0,
    assignmentTitle:"《一件难忘的小事》", sourceType:"校内作文",
    reason:"本次作文《一件难忘的小事》疑似AI代写，建议留意",
    evidence:"本次作文《一件难忘的小事》经现有批改流程判定为疑似AI代写，判定理由：用词与句式风格与该生历史作文明显不符，出现超出该学段常见水平的修辞表达。",
    status:"pending",
    copy:null,
    points:["该判定为较低置信度提示，建议先结合该生历史写作水平自行判断，不建议直接联系家长指控","可考虑当面请孩子简述创作思路，观察是否能自然说清楚","如后续同类信号持续出现，建议重点核实"],
    warn:"疑似AI代写涉及对学生的指控性判断，证据不充分时家长反弹风险较高，因此不生成家长沟通话术，仅供老师内部参考判断。",
    timingAdvice:"建议先在校内通过与孩子当面沟通核实，暂不急于联系家长；如需联系家长，建议在核实之后再安排。",
    channelAdvice:"建议当面沟通为主，避免文字或电话记录造成误解；暂无该生历史沟通记录可参考。",
    scriptAdvice:"不提供家长沟通话术，仅供老师与孩子沟通时参考：以了解创作过程为切入点，避免直接指控。",
    followUps:[]
  },
  {
    name:"陆星辰", cls:"八上8-2班", phone:"15845676623", tier:"A", level:"ghost", filterKey:"hw-ghost", perfLabel:"作业表现·疑似AI代写",
    category:"risk", subtype:"ghost", priority:"high", isNew:false, daysAgo:0,
    assignmentTitle:"《成长的滋味》", sourceType:"阅读宝典",
    reason:"本次作文《成长的滋味》疑似AI代写，证据强度高，建议重点核实",
    evidence:"本次作文《成长的滋味》经现有批改流程判定为疑似AI代写，且证据强度高，判定理由：整体行文风格、用词密度与该生历次作文数据差异显著，且出现明显超越学段的长句结构。",
    status:"pending",
    copy:null,
    points:["建议老师私下与孩子沟通确认创作过程，避免在班级或书面反馈中公开质疑","如需联系家长，建议以「想更了解孩子这次写作的想法」为切入点，而非直接质疑","该判定不生成家长沟通文案，比照高风险处理方式，仅供老师内部参考"],
    warn:"疑似AI代写涉及对学生的指控性判断，证据不充分时家长反弹风险高于情绪风险低风险场景，因此比照高风险处理方式，不生成家长沟通话术。",
    timingAdvice:"证据强度高，建议尽快在校内与孩子当面沟通核实，避免拖延导致情况复杂化。",
    channelAdvice:"建议当面沟通为主，比照高风险场景处理；暂无该生历史沟通记录可参考。",
    scriptAdvice:"不提供家长沟通话术，仅供老师与孩子沟通时参考：以「想更了解这次写作的想法」为切入点，避免直接质疑。",
    followUps:[]
  }
];

const statusMap = {
  pending:{cls:"status-pending", label:"待处理"},
  done:{cls:"status-done", label:"已处理"},
  ignored:{cls:"status-ignored", label:"已忽略"}
};
const sevMap = { risk:{emotion:"sev-risk", ghost:"sev-ghost"}, weak:"sev-weak", good:"sev-good" };
const tierMap = {
  A:{cls:"tier-a", label:"A层"},
  B:{cls:"tier-b", label:"B层"}
};
function sevClassOf(row){
  if(row.category === "risk") return sevMap.risk[row.subtype];
  return sevMap[row.category];
}

// 列表页“建议反馈”摘要文案：按 category/subtype/level 分类映射，取代旧版仅判断 copy 是否存在的二元逻辑（2026-09-15）
function suggestSummaryOf(row){
  if(row.category === "good") return "建议：肯定鼓励";
  if(row.category === "weak") return "建议：巩固辅导";
  if(row.category === "risk"){
    if(row.subtype === "ghost") return "建议：核实确认";
    if(row.subtype === "emotion") return row.level === "l3" ? "建议：谨慎沟通，已同步复核" : "建议：谨慎沟通";
  }
  return "建议：查看详情";
}

const casePriority = { urgent:100, high:70, mid:40 };
function priorityOf(i){ return casePriority[data[i].priority] ?? 0; }

// 该学生全部 case（不限处理状态、不受当前筛选条件影响），按生成时间倒序，供详情页时间轴使用
function getAllCasesForStudent(name, cls){
  return data
    .map((r, idx) => ({ r, idx }))
    .filter(({r}) => r.name === name && r.cls === cls)
    .sort((a, b) => tsOf(b.r.daysAgo) - tsOf(a.r.daysAgo));
}

// 详情弹窗"反馈建议"模块的生成依据（2026-09-15）：不再由老师点击时间轴哪个case决定，
// 而是固定取该生全部case（不限维度/不限处理状态）中触发时间最新的一条；
// 若同一次触发同时命中多个维度（同一时间戳有多条case，如主维度+同批次其他维度），
// 按 casePriority 取其中优先级最高的一条——与列表页主展示行摘要的选取规则一致（见 PRD 4.3/4.7节），
// 但两处的排序维度不同：列表页是"当前筛选命中范围内取优先级最高"，这里是"全部case中先取触发时间最新，同时刻再取优先级最高"。
function pickFeedbackCaseIdx(sortedCases){
  if(!sortedCases.length) return null;
  const latestTs = tsOf(sortedCases[0].r.daysAgo);
  const sameTime = sortedCases.filter(c => tsOf(c.r.daysAgo) === latestTs);
  sameTime.sort((a, b) => (casePriority[b.r.priority] ?? 0) - (casePriority[a.r.priority] ?? 0));
  return sameTime[0].idx;
}

// 该学生所有 case 的主标签 + 次要维度标签，去重后按优先级排序，供列表行整体展示（见 PRD 4.3/4.4）
function getAllTagsForStudent(name, cls){
  const cases = getAllCasesForStudent(name, cls);
  const tags = [];
  const seen = new Set();
  cases.forEach(({r, idx}) => {
    const primaryKey = r.filterKey + '|' + r.perfLabel;
    if(!seen.has(primaryKey)){
      seen.add(primaryKey);
      tags.push({ label:r.perfLabel, level:r.level, filterKey:r.filterKey, priority:r.priority, idx });
    }
    (r.secondaryDims || []).forEach(d => {
      const key = d.filterKey + '|' + d.perfLabel;
      if(!seen.has(key)){
        seen.add(key);
        tags.push({ label:d.perfLabel, level:d.level, filterKey:d.filterKey, priority:d.priority, idx });
      }
    });
  });
  tags.sort((a, b) => (casePriority[b.priority] ?? 0) - (casePriority[a.priority] ?? 0));
  return tags;
}

// 确定性伪随机：同一 seed 字符串每次生成的序列一致，用于生成 demo 数据（学情学习数据、课程信息、新老生标识等）
function makeRand(seedStr){
  let seed = 0;
  for(let i=0;i<seedStr.length;i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed % 1000) / 1000; };
}

// ---- 学情信息：历史学习数据（demo 数据按学生姓名确定性生成，保持每次打开一致），供跟进反馈时参考 ----
function computeArchiveData(name, cls){
  const rand = makeRand(name);
  const totalSessions = 12;
  const attend = Math.round(totalSessions * (0.72 + rand()*0.22));
  const notAttend = totalSessions - attend;
  const playback = Math.round(notAttend * (0.4 + rand()*0.5));
  const submit = Math.round(totalSessions * (0.7 + rand()*0.25));
  const notSubmit = totalSessions - submit;
  const select = Math.round(1 + rand()*3);
  const quizJoinRate = Math.round(70 + rand()*25);
  const quizCorrectRate = Math.round(60 + rand()*30);
  const interactTriggered = Math.round(8 + rand()*20);
  const interactTotal = Math.round(interactTriggered * (1.3 + rand()));
  const speakSessions = Math.round(3 + rand()*6);
  const cameraSessions = Math.round(6 + rand()*6);
  const cameraMinutes = Math.round(cameraSessions * (20 + rand()*15));

  const cases = getAllCasesForStudent(name, cls);
  const titles = [...new Set(cases.map(c => c.r.assignmentTitle).filter(Boolean))];
  const fillerTitles = ["第9课·综合复习","第8课·阅读理解专题","第7课·写作技巧","第6课·病句修改专题","第5课·古诗词鉴赏"];
  const sessionNames = [...titles, ...fillerTitles].slice(0, 6);
  const sessionTypes = ["直播课","录播课","课后练习"];
  const stars = ["★★★★★","★★★★☆","★★★☆☆","—"];
  const rows = sessionNames.map((title, i) => {
    const attended = rand() > 0.15;
    const submitted = rand() > 0.2;
    return {
      date: fmtTime(tsOf(i*7)).split(" ")[0],
      title,
      type: sessionTypes[i % sessionTypes.length],
      swapped: rand() > 0.85 ? "是" : "否",
      attended,
      attendMin: attended ? Math.round(30 + rand()*15) : 0,
      playbackMin: !attended && rand() > 0.5 ? Math.round(10 + rand()*30) : 0,
      submitted,
      star: submitted ? stars[Math.floor(rand()*(stars.length-1))] : "—",
      answered: attended ? `${Math.round(rand()*8)}/8` : "—"
    };
  });

  return {
    stats: [
      {label:"出席", value:`${attend}/${totalSessions}`},
      {label:"回放", value:`${playback}次`},
      {label:"作业提交", value:`${submit}/${totalSessions}`},
      {label:"精选次数", value:`${select}次`},
      {label:"课中题参与率", value:`${quizJoinRate}%`},
      {label:"课中题正确率", value:`${quizCorrectRate}%`},
      {label:"课中互动次数", value:`${interactTriggered}次`, sub:`触发互动总数 ${interactTotal}`},
      {label:"课堂发言条数", value:`${speakSessions}条`, sub:"有留言的课量"},
      {label:"开摄像头时长", value:`${cameraMinutes}分钟`, sub:`${cameraSessions}课节`}
    ],
    badges: [
      {label:`未出席 ${notAttend}`, tone: notAttend > 0 ? "amber" : "grey"},
      {label:`未提交作业 ${notSubmit}`, tone: notSubmit > 0 ? "red" : "grey"},
      {label:`已精选 ${select}`, tone:"green"},
      {label:`回放 ${playback}`, tone:"grey"}
    ],
    rows
  };
}

// ---- 学生基本信息：课程信息、新老生标识（demo 数据按学生姓名+班级确定性生成）----
function computeStudentProfile(name, cls){
  const rand = makeRand(name + cls);
  const studentType = rand() > 0.5 ? "新生" : "老生";
  const courseTitles = [
    "测试续费使用【仿造】【一阶（下）】泉灵的表达素养课 2015春7期",
    "测试续费使用【仿造】【二阶（上）】泉灵的表达素养课 2016秋3期",
    "测试续费使用【仿造】【一阶（上）】泉灵的表达素养课 2017春2期"
  ];
  const scheduleOptions = [
    "出席1（出席）周一20:00 周六17:00",
    "出席1（出席）周二19:30 周日10:00",
    "出席1（出席）周三20:00 周日15:00"
  ];
  return {
    studentType,
    courseTitle: courseTitles[Math.floor(rand()*courseTitles.length)],
    schedule: scheduleOptions[Math.floor(rand()*scheduleOptions.length)]
  };
}

// ---- 最近电话联系时间：demo 数据按学生姓名+班级确定性生成，约15%学生尚无电话联系记录 ----
function computeLastCallTs(name, cls){
  const rand = makeRand(name + cls + '#call');
  if(rand() < 0.15) return null;
  const daysAgo = 1 + Math.floor(rand() * 13);
  return tsOf(daysAgo) - Math.floor(rand() * DAY);
}

// ---- 手机号脱敏：中间4位替换为星号，供列表/详情弹窗展示 ----
function maskPhone(phone){
  if(!phone) return '未登记手机号';
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

// ---- Toast（列表页/学生详情弹窗共用） ----
function showToast(msg, type = "info"){
  const container = document.getElementById('toastContainer');
  if(!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="tdot"></span><span>${msg}</span>`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, 2600);
}
