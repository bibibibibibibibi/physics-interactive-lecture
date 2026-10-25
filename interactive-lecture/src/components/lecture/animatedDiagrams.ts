/** 会自动随时间变化的图示注册名 —— 由 `work/gen_anim_list.py` 从 diagrams.tsx
 *  生成，**请勿手改**（改了 diagrams.tsx 就重跑那个脚本；`--check` 可校验是否过期）。
 *
 *  判定依据：组件签名收了时钟 t，且函数体真的用它（ph/osc/pingpong/trip/tripEnd 的第一个
 *  参数）。其余图示都是一次成型的静态图。
 *
 *  用途：单文件幻灯片只在当页图示**真的会动**时才显示动画控制条 —— 静态图上拖相位
 *  没有任何反应，控制条却出现，会让人以为那条控件坏了（用户反馈过）。 */
export const ANIMATED_DIAGRAMS: ReadonlySet<string> = new Set([
  'acc_avg',
  'acc_dir',
  'ball_liquid',
  'beat_rotvec',
  'circ_det',
  'circ_et',
  'curvature',
  'curve_ab',
  'disp_vs_path',
  'exp3_curves',
  'galton_board',
  'liss_anim',
  'nat_coord',
  'pendulum_anim',
  'proj_full',
  'proj_plane',
  'proj_range',
  'proj_vec',
  'rel_clock_scale',
  'rel_displacement',
  'rel_traj',
  'rigid_rod',
  'rotvec_anim',
  'rotvec_va',
  'rotvec_xt',
  'spring_anim',
  'standing_wave',
  'traj_curve3d',
  'traj_ex1',
  'uniform_circ',
  'vel_tangent',
  'wave_formation',
  'wave_travel',
])
