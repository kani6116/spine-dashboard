import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Calculator, 
  ListFilter, 
  Target, 
  Edit3, 
  TrendingDown, 
  Users, 
  ChevronRight,
  Layers,
  Clock
} from 'lucide-react';

// --- 常量与估时模型 ---

const CURRENT_DATE = "2026-01-14"; // 更新至1.14
const DEADLINE = "2026-02-14";

const ESTIMATES = {
  art: 1,   
  split: 2, 
  normalAnim: {
    S: 8, A: 8, B: 8, C: 6, idleOnly: 2.5
  },
  qAnim: {
    S: 6, A: 5, B: 4, C: 2.5, baseOnly: 2.5
  }
};

const INITIAL_CHARACTERS = [
  { id: '1001', name: '老年卡西安', tier: 'C', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: false, qArt: 'none', qSplit: 'none', qAnim: 'none', note: '只做正比' },
  { id: '1002', name: '女主艾琳', tier: 'S', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: true, qArt: 'done', qSplit: 'done', qAnim: 'testing', note: '动画验证中' },
  { id: '1003', name: '渣男卢卡斯', tier: 'A', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: true, qArt: 'done', qSplit: 'done', qAnim: 'todo', note: 'Q版重跑' },
  { id: '1004', name: '渣女麦迪森', tier: 'A', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: true, qArt: 'done', qSplit: 'done', qAnim: 'todo', note: 'Q版重跑' },
  { id: '1005', name: '管家史密斯', tier: 'B', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: true, qArt: 'done', qSplit: 'done', qAnim: 'todo', note: '' },
  { id: '1006', name: '律师朱利安', tier: 'B', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: true, qArt: 'done', qSplit: 'done', qAnim: 'todo', note: '' },
  { id: '1008', name: '豹猫小杰特', tier: 'B', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: true, qArt: 'done', qSplit: 'done', qAnim: 'todo', note: 'Q版重跑' },
  { id: '1009', name: '管理员迦文', tier: 'C', needsNormal: true, normalArt: 'done', normalSplit: 'done', normalAnim: 'todo', needsQ: true, qArt: 'done', qSplit: 'todo', qAnim: 'todo', note: 'AI跑图极快' },
  { id: '1011', name: '男一艾德里安', tier: 'A', needsNormal: true, normalArt: 'done', normalSplit: 'todo', normalAnim: 'todo', needsQ: true, qArt: 'todo', qSplit: 'todo', qAnim: 'todo', note: 'Q版重跑' },
  { id: '1013', name: '男三卡西安', tier: 'A', needsNormal: true, normalArt: 'done', normalSplit: 'todo', normalAnim: 'todo', needsQ: true, qArt: 'todo', qSplit: 'todo', qAnim: 'todo', note: 'Q版重跑' },
];

const ProjectScheduler = () => {
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS);
  const [currentDate] = useState(CURRENT_DATE);
  const [deadline] = useState(DEADLINE);
  
  const [artManpower, setArtManpower] = useState(1.0);       
  const [splitManpower, setSplitManpower] = useState(1.0); 
  const [animManpower, setAnimManpower] = useState(1.0);
  const [strategy, setStrategy] = useState('full');

  // 排序逻辑：按 S, A, B, C 顺序
  const sortedCharacters = useMemo(() => {
    const tierOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3 };
    return [...characters].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  }, [characters]);

  const workDaysRemaining = useMemo(() => {
    let start = new Date(currentDate);
    let end = new Date(deadline);
    if (start > end) return 0;
    let count = 0;
    let cur = new Date(start);
    while (cur <= end) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [currentDate, deadline]);

  const getTaskLoad = (char, type, subType) => {
    if (type === 'art') return ESTIMATES.art;
    if (type === 'split') return ESTIMATES.split;
    if (type === 'anim') {
      const base = subType === 'normal' ? ESTIMATES.normalAnim[char.tier] : ESTIMATES.qAnim[char.tier];
      const strategyAdjust = (strategy === 'mvp') ? (subType === 'normal' ? ESTIMATES.normalAnim.idleOnly : ESTIMATES.qAnim.baseOnly) : base;
      if (subType === 'q' && char.qAnim === 'testing') return Math.max(0, strategyAdjust - 2);
      return strategyAdjust;
    }
    return 0;
  };

  const getWorkload = (char, type) => {
    let days = 0;
    if (type === 'art') {
      if (char.needsNormal && char.normalArt === 'todo') days += getTaskLoad(char, 'art');
      if (char.needsQ && char.qArt === 'todo') days += getTaskLoad(char, 'art');
    }
    if (type === 'split') {
      if (char.needsNormal && char.normalSplit === 'todo') days += getTaskLoad(char, 'split');
      if (char.needsQ && char.qSplit === 'todo') days += getTaskLoad(char, 'split');
    }
    if (type === 'anim') {
      if (char.needsNormal && char.normalAnim !== 'done') days += getTaskLoad(char, 'anim', 'normal');
      if (char.needsQ && char.qAnim !== 'done') days += getTaskLoad(char, 'anim', 'q');
    }
    return days;
  };

  const stats = useMemo(() => {
    let artNeeded = 0;
    let splitNeeded = 0;
    let animNeeded = 0;
    characters.forEach(char => {
      artNeeded += getWorkload(char, 'art');
      splitNeeded += getWorkload(char, 'split');
      animNeeded += getWorkload(char, 'anim');
    });
    
    const internalCapacity = (artManpower + splitManpower + animManpower) * workDaysRemaining;

    return {
      art: { needed: artNeeded, gap: (workDaysRemaining * artManpower) - artNeeded },
      split: { needed: splitNeeded, gap: (workDaysRemaining * splitManpower) - splitNeeded },
      anim: { needed: animNeeded, gap: (workDaysRemaining * animManpower) - animNeeded },
      totalNeeded: artNeeded + splitNeeded + animNeeded,
      internalCapacity: internalCapacity
    };
  }, [characters, workDaysRemaining, artManpower, splitManpower, animManpower, strategy]);

  const outsourceData = useMemo(() => {
    const items = [];
    characters.forEach(char => {
      if (char.needsNormal && char.normalAnim === 'todo') {
        const load = getTaskLoad(char, 'anim', 'normal');
        if (char.tier === 'C') items.push({ ...char, task: '正比动画', load, priority: 'C' });
        else if (char.tier === 'B' && stats.anim.gap < -5) items.push({ ...char, task: '正比动画', load, priority: 'B' });
      }
      if (char.needsQ && char.qAnim === 'todo') {
        const load = getTaskLoad(char, 'anim', 'q');
        if (char.tier === 'C') items.push({ ...char, task: 'Q版动画', load, priority: 'C' });
        else if (char.tier === 'B') items.push({ ...char, task: 'Q版动画', load, priority: 'B' });
        else if (char.tier === 'A' && stats.anim.gap < -10) items.push({ ...char, task: 'Q版动画', load, priority: 'A' });
      }
      if (char.needsQ && char.qSplit === 'todo' && stats.split.gap < 0) {
        const load = getTaskLoad(char, 'split');
        if (char.tier !== 'S') items.push({ ...char, task: 'Q版拆分', load, priority: char.tier === 'A' ? 'A' : 'B' });
      }
    });

    const grouped = {
      'A': items.filter(i => i.priority === 'A'),
      'B': items.filter(i => i.priority === 'B'),
      'C': items.filter(i => i.priority === 'C')
    };

    const getLoad = (arr) => arr.reduce((sum, i) => sum + i.load, 0);

    return { 
      grouped, 
      totalLoad: getLoad(items),
      tierLoads: { A: getLoad(grouped.A), B: getLoad(grouped.B), C: getLoad(grouped.C) }
    };
  }, [characters, stats.anim.gap, stats.split.gap, strategy]);

  const updateChar = (id, field, val) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const getStatusStyle = (status) => {
    if (status === 'done') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'wip' || status === 'testing') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (status === 'todo') return 'bg-white text-slate-500 border-slate-300';
    return 'bg-gray-100 text-gray-400';
  };

  const PowerSlider = ({ label, value, onChange, gap, icon: Icon, isCritical }) => (
    <div className={`flex-1 p-4 rounded-xl border transition-all hover:shadow-md ${isCritical && gap < -5 ? 'bg-red-50 border-red-100 shadow-red-50' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
           <div className={`p-1.5 rounded ${isCritical && gap < -5 ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-500'}`}>
              <Icon size={12}/>
           </div>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
        </div>
        <div className="text-lg font-black text-slate-800 font-mono">{value.toFixed(1)}<span className="text-[10px] ml-0.5 text-slate-300">P</span></div>
      </div>
      <input 
        type="range" min="0" max="5" step="0.1" 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all ${isCritical && gap < -5 ? 'bg-red-200 accent-red-600' : 'bg-slate-200'}`}
      />
      <div className={`mt-2 flex items-center gap-1.5 text-[9px] font-bold ${gap < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
        {gap < 0 ? <AlertTriangle size={10}/> : <CheckCircle size={10}/>}
        缺口: {gap.toFixed(1)}d
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-[1400px] mx-auto bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter italic">
            <Clock className="text-indigo-600" />
            2.14 P0 角色资源进度 (1.14版)
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 italic">
            Current Date: <span className="text-indigo-500">{currentDate}</span> | Days Left: <span className="text-indigo-500">{workDaysRemaining}d</span>
          </p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setStrategy('full')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${strategy === 'full' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200'}`}>全量模式 (S/A/B:8d)</button>
           <button onClick={() => setStrategy('mvp')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${strategy === 'mvp' ? 'bg-amber-600 text-white shadow-amber-200' : 'bg-white text-slate-600 border border-slate-200'}`}>MVP模式 (Idle:2.5d)</button>
        </div>
      </div>

      {/* 顶部看板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-600 text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-black text-red-100 uppercase tracking-wider">动画总工时需求</span>
            <TrendingDown size={14} className="text-red-200" />
          </div>
          <div className="mt-4 flex items-baseline gap-2 relative z-10">
            <span className="text-4xl font-black">{stats.anim.needed.toFixed(1)}</span>
            <span className="text-xs font-bold text-red-200 uppercase">Days</span>
          </div>
          <div className="mt-4 pt-4 border-t border-red-500 flex justify-between text-[9px] font-bold relative z-10">
            <span className="text-red-100 uppercase italic">CRITICAL BOTTLENECK</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-200 group">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">内部可用总产能</span>
            <Users size={14} className="text-emerald-500" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{stats.internalCapacity.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Capacity</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-[9px] font-bold text-slate-400">
            <span>需求总计: {stats.totalNeeded.toFixed(1)}d</span>
            <span className={stats.internalCapacity < stats.totalNeeded ? 'text-red-500' : 'text-emerald-500'}>
              差额: {(stats.internalCapacity - stats.totalNeeded).toFixed(1)}d
            </span>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex gap-2">
            <PowerSlider label="跑图 (AI)" value={artManpower} onChange={setArtManpower} gap={stats.art.gap} icon={Edit3} />
            <PowerSlider label="拆分 (2D)" value={splitManpower} onChange={setSplitManpower} gap={stats.split.gap} icon={Layers} />
            <PowerSlider label="动画 (Spine)" value={animManpower} onChange={setAnimManpower} gap={stats.anim.gap} icon={TrendingDown} isCritical />
        </div>
      </div>

      {/* 角色明细表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            {/* 第一层表头：环节与标准 */}
            <tr className="bg-slate-900 text-white text-[9px] uppercase font-black">
              <th className="p-4 sticky left-0 bg-slate-900 z-10 w-56 border-b border-slate-700">角色 (按级别排序)</th>
              <th className="px-2 py-2 text-center border-l border-slate-700" colSpan={3}>正比 (NORMAL) <span className="text-slate-500 ml-2 font-normal">标准: S/A/B:8d C:6d</span></th>
              <th className="px-2 py-2 text-center border-l border-slate-700" colSpan={4}>Q版 (CHIBI) <span className="text-slate-500 ml-2 font-normal">标准: S:6d A:5d B:4d C:2.5d</span></th>
              <th className="px-4 text-right border-l border-slate-700">统计</th>
            </tr>
            {/* 第二层表头 */}
            <tr className="bg-slate-50 border-b border-slate-200 text-[8px] uppercase font-bold text-slate-500">
              <th className="px-4 py-2 sticky left-0 bg-slate-50 z-10">TIER / NAME</th>
              <th className="px-2 py-2 text-center">跑图 (1d)</th>
              <th className="px-2 py-2 text-center">拆分 (2d)</th>
              <th className="px-2 py-2 text-center border-r border-slate-200 bg-red-50 text-red-600 italic">动画需求</th>
              <th className="px-2 py-2 text-center">需要Q?</th>
              <th className="px-2 py-2 text-center">跑图 (1d)</th>
              <th className="px-2 py-2 text-center">拆分 (2d)</th>
              <th className="px-2 py-2 text-center border-r border-slate-200 bg-red-50 text-red-600 italic">动画需求</th>
              <th className="px-4 py-2 text-right">剩余合计</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedCharacters.map(char => {
              const totalLoad = getWorkload(char, 'art') + getWorkload(char, 'split') + getWorkload(char, 'anim');
              const normalAnimLoad = getTaskLoad(char, 'anim', 'normal');
              const qAnimLoad = getTaskLoad(char, 'anim', 'q');
              
              return (
                <tr key={char.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="p-4 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-lg font-black ${
                            char.tier === 'S' ? 'bg-indigo-600 text-white shadow-indigo-100' : 
                            char.tier === 'A' ? 'bg-purple-600 text-white shadow-purple-100' :
                            char.tier === 'B' ? 'bg-blue-500 text-white shadow-blue-100' :
                            'bg-slate-400 text-white'
                          } shadow-md`}>{char.tier}</span>
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 whitespace-nowrap">{char.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold tracking-tighter italic">{char.note || 'No notes'}</span>
                       </div>
                    </div>
                  </td>
                  {/* 正比管线 */}
                  <td className="px-2 py-3 bg-white/50"><select className={`w-full text-[10px] p-1.5 rounded-lg border font-bold ${getStatusStyle(char.normalArt)}`} value={char.normalArt} onChange={e=>updateChar(char.id, 'normalArt', e.target.value)}><option value="todo">待办</option><option value="done">已完成</option></select></td>
                  <td className="px-2 py-3 bg-white/50"><select className={`w-full text-[10px] p-1.5 rounded-lg border font-bold ${getStatusStyle(char.normalSplit)}`} value={char.normalSplit} onChange={e=>updateChar(char.id, 'normalSplit', e.target.value)}><option value="todo">待办</option><option value="done">已完成</option></select></td>
                  <td className="px-2 py-3 bg-red-50/30 border-r border-slate-200 relative">
                     <select className={`w-full text-[10px] p-1.5 rounded-lg border font-bold ${getStatusStyle(char.normalAnim)}`} value={char.normalAnim} onChange={e=>updateChar(char.id, 'normalAnim', e.target.value)}><option value="todo">待办</option><option value="wip">制作中</option><option value="done">已完成</option></select>
                     {char.normalAnim !== 'done' && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] px-1 rounded-full font-black animate-pulse">{normalAnimLoad}d</span>}
                  </td>
                  {/* Q版管线 */}
                  <td className="px-1 py-3 text-center bg-white/50"><input type="checkbox" checked={char.needsQ} onChange={e=>updateChar(char.id, 'needsQ', e.target.checked)} className="w-4 h-4 accent-amber-500 rounded"/></td>
                  <td className="px-2 py-3 bg-white/50">{char.needsQ ? <select className={`w-full text-[10px] p-1.5 rounded-lg border font-bold ${getStatusStyle(char.qArt)}`} value={char.qArt} onChange={e=>updateChar(char.id, 'qArt', e.target.value)}><option value="todo">待办</option><option value="done">已完成</option></select> : <span className="text-slate-200 text-[10px] block text-center">-</span>}</td>
                  <td className="px-2 py-3 bg-white/50">{char.needsQ ? <select className={`w-full text-[10px] p-1.5 rounded-lg border font-bold ${getStatusStyle(char.qSplit)}`} value={char.qSplit} onChange={e=>updateChar(char.id, 'qSplit', e.target.value)}><option value="todo">待办</option><option value="done">已完成</option></select> : <span className="text-slate-200 text-[10px] block text-center">-</span>}</td>
                  <td className="px-2 py-3 bg-red-50/30 border-r border-slate-200 relative">
                    {char.needsQ ? (
                      <>
                        <select className={`w-full text-[10px] p-1.5 rounded-lg border font-bold ${getStatusStyle(char.qAnim)}`} value={char.qAnim} onChange={e=>updateChar(char.id, 'qAnim', e.target.value)}><option value="todo">待办</option><option value="testing">测试中</option><option value="wip">制作中</option><option value="done">已完成</option></select>
                        {char.qAnim !== 'done' && <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[7px] px-1 rounded-full font-black animate-pulse">{qAnimLoad}d</span>}
                      </>
                    ) : <span className="text-slate-200 text-[10px] block text-center">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {totalLoad > 0 ? `${totalLoad.toFixed(1)}d` : <CheckCircle size={16} className="ml-auto text-emerald-500 shadow-sm"/>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 外包决策板 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={20}/>
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">动画缺口专项：外包建议</h3>
                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tight">Focus on Animation Bottleneck</p>
              </div>
           </div>
           
           <div className="flex items-center gap-10">
              <div className="flex gap-6 border-r border-slate-800 pr-10">
                 {['A', 'B', 'C'].map(t => (
                   <div key={t} className="text-right">
                      <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 leading-none">{t}级负载</div>
                      <div className={`text-lg font-black leading-none ${t === 'A' ? 'text-purple-400' : t === 'B' ? 'text-blue-400' : 'text-slate-400'}`}>{outsourceData.tierLoads[t].toFixed(1)} <span className="text-[10px] opacity-30">d</span></div>
                   </div>
                 ))}
              </div>
              <div className="text-right bg-red-500/5 px-4 py-3 rounded-xl border border-red-500/20">
                <div className="text-[9px] text-red-400 font-black uppercase tracking-widest mb-1 leading-none">缺口压力</div>
                <div className="text-2xl font-black text-red-400 leading-none tracking-tighter">
                  {Math.abs(stats.anim.gap).toFixed(1)} <span className="text-xs font-normal opacity-60">人天</span>
                </div>
              </div>
           </div>
        </div>
        
        <div className="p-6">
           {outsourceData.totalLoad > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['A', 'B', 'C'].map(tier => (
                  <div key={tier} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col h-full shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-4 rounded-full ${tier === 'A' ? 'bg-purple-500' : tier === 'B' ? 'bg-blue-500' : 'bg-slate-400'} shadow-lg`}></div>
                         <span className="text-xs font-black text-slate-800 uppercase tracking-widest">优先级 Tier {tier}</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-1 rounded bg-white border border-slate-200 text-slate-500">{outsourceData.tierLoads[tier].toFixed(1)}d</span>
                    </div>
                    <div className="space-y-2">
                      {outsourceData.grouped[tier].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-[11px] font-black text-slate-800">{item.name}</span>
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">{item.task} ({item.load}d)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-10 opacity-50 font-black uppercase text-xs tracking-widest">目前产能足以覆盖，无需外包</div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;

// --- 样式注入 ---
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 18px;
      width: 18px;
      border-radius: 50%;
      background: #4f46e5;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      cursor: pointer;
      border: 3px solid white;
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `;
  document.head.appendChild(style);
}