export type Role = 'child' | 'parent';

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  note: string;
  reminder?: boolean;
}

export interface Task {
  id: string;
  done: boolean;
  title: string;
  meta: string;
  tags: string[];
}

export interface TimetableItem {
  day: string;
  time: string;
  subject: string;
  teacher?: string;
  room?: string;
}

export interface BarItem {
  label: string;
  value: number;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
}

export interface Goal {
  id: string;
  title: string;
  note: string;
  value: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: Role;
  totalPoints: number;
  weeklyPoints: number;
  focusBadge: string;
  tasks: Task[];
  timeline: TimelineItem[];
  timetable: TimetableItem[];
  bars: BarItem[];
  rewards: Reward[];
  goals: Goal[];
}

export const DEFAULT_TAGS = ['Học tập', 'Việc nhà', 'Cá nhân', 'Ưu tiên', 'Cuối tuần'];

export const INITIAL_FAMILY: FamilyMember[] = [
  {
    id: 'parent1',
    name: 'Bố Minh',
    avatar: '👨',
    role: 'parent',
    totalPoints: 0,
    weeklyPoints: 0,
    focusBadge: 'Quản lý',
    tasks: [
      { id: 'pt1', done: false, title: 'Tạo việc cuối tuần cho cả nhà', meta: 'Cần thiết lập', tags: ['Cuối tuần', 'Việc nhà'] },
      { id: 'pt2', done: true, title: 'Chốt quỹ điểm thưởng tháng', meta: 'Hoàn tất', tags: ['Cá nhân'] },
    ],
    timeline: [
      { id: 'ps1', time: '06:45', title: 'Nhắc các bé chuẩn bị đi học', note: 'Gửi nhắc tự động nếu chưa check-in trước 07:10.', reminder: true },
      { id: 'ps2', time: '17:30', title: 'Kiểm tra việc nhà trong ngày', note: 'Các việc của các con đang chờ xác nhận.', reminder: false },
      { id: 'ps3', time: '21:00', title: 'Thiết lập lịch cho ngày mai', note: 'Có thể duplicate từ hôm nay rồi sửa nhanh.', reminder: true },
    ],
    timetable: [],
    bars: [
      { label: 'Na', value: 82 },
      { label: 'Bi', value: 69 },
      { label: 'Học', value: 88 },
      { label: 'Nhà', value: 71 },
    ],
    rewards: [
      { id: 'pr1', title: 'Voucher đi bơi cuối tuần', cost: 350 },
      { id: 'pr2', title: 'Buổi picnic gia đình', cost: 800 },
    ],
    goals: [
      { id: 'pg1', title: 'Xây thói quen tự lập cho các bé', note: 'Theo dõi 30 ngày không cần nhắc thủ công.', value: 61 },
    ],
  },
  {
    id: 'parent2',
    name: 'Mẹ Lan',
    avatar: '👩',
    role: 'parent',
    totalPoints: 0,
    weeklyPoints: 0,
    focusBadge: 'Quản lý',
    tasks: [
      { id: 'mt1', done: true, title: 'Duyệt lịch học của Na', meta: 'Đã xác nhận', tags: ['Học tập', 'Ưu tiên'] },
      { id: 'mt2', done: false, title: 'Xác minh ảnh hoàn thành công việc', meta: '3 mục chờ duyệt', tags: ['Ưu tiên'] },
    ],
    timeline: [
      { id: 'ms1', time: '06:45', title: 'Nhắc các bé chuẩn bị đi học', note: 'Gửi nhắc tự động nếu chưa check-in trước 07:10.', reminder: true },
      { id: 'ms2', time: '20:00', title: 'Tổng hợp tiến độ học tập', note: 'Đối chiếu lịch học thêm và bài tập còn lại.', reminder: false },
    ],
    timetable: [],
    bars: [
      { label: 'Na', value: 82 },
      { label: 'Bi', value: 69 },
      { label: 'Học', value: 88 },
      { label: 'Nhà', value: 71 },
    ],
    rewards: [
      { id: 'mr1', title: 'Voucher đi bơi cuối tuần', cost: 350 },
    ],
    goals: [
      { id: 'mg1', title: 'Xây thói quen tự lập cho các bé', note: 'Theo dõi 30 ngày không cần nhắc thủ công.', value: 61 },
    ],
  },
  {
    id: 'child1',
    name: 'Bi',
    avatar: '👦',
    role: 'child',
    totalPoints: 320,
    weeklyPoints: 85,
    focusBadge: 'Ưu tiên học tập',
    tasks: [
      { id: 'b1', done: true, title: 'Gấp chăn buổi sáng', meta: '+10 điểm', tags: ['Việc nhà'] },
      { id: 'b2', done: false, title: 'Làm bài tập Toán', meta: '+20 điểm', tags: ['Học tập', 'Ưu tiên'] },
      { id: 'b3', done: false, title: 'Luyện đọc 20 phút', meta: '+15 điểm', tags: ['Học tập'] },
      { id: 'b4', done: false, title: 'Rửa bát sau bữa tối', meta: '+10 điểm', tags: ['Việc nhà'] },
      { id: 'b5', done: false, title: 'Tập đàn piano', meta: '+25 điểm', tags: ['Cá nhân'] },
    ],
    timeline: [
      { id: 'bs1', time: '07:00', title: 'Dậy và chuẩn bị đi học', note: 'Checklist buổi sáng đã được mẹ cài sẵn.', reminder: false },
      { id: 'bs2', time: '08:00', title: 'Lớp học ở trường', note: 'Mang theo bài tập Toán và bình nước.', reminder: true },
      { id: 'bs3', time: '16:30', title: 'Học piano', note: 'Buổi học 45 phút tại phòng khách.', reminder: false },
      { id: 'bs4', time: '19:00', title: 'Rửa bát', note: 'Hoàn thành trước khi xem TV.', reminder: false },
    ],
    timetable: [
      { day: 'T2', time: '07:30', subject: 'Toán', teacher: 'Cô Lan', room: 'P.201' },
      { day: 'T2', time: '09:00', subject: 'Tiếng Việt', teacher: 'Thầy Minh', room: 'P.203' },
      { day: 'T3', time: '07:30', subject: 'Khoa học', teacher: 'Cô Hoa', room: 'P.105' },
      { day: 'T3', time: '09:00', subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'P.301' },
      { day: 'T3', time: '16:30', subject: 'Học piano', teacher: 'Thầy Tuấn', room: 'Phòng khách' },
      { day: 'T4', time: '07:30', subject: 'Toán', teacher: 'Cô Lan', room: 'P.201' },
      { day: 'T4', time: '09:00', subject: 'Mỹ thuật', teacher: 'Thầy Bình', room: 'P.502' },
      { day: 'T5', time: '07:30', subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'P.301' },
      { day: 'T5', time: '09:00', subject: 'Thể dục', teacher: 'Thầy Nam', room: 'Sân vận động' },
      { day: 'T6', time: '07:30', subject: 'Toán', teacher: 'Cô Lan', room: 'P.201' },
      { day: 'T6', time: '09:00', subject: 'Tiếng Việt', teacher: 'Thầy Minh', room: 'P.203' },
      { day: 'T7', time: '09:00', subject: 'Ôn tập Toán', teacher: 'Gia sư Dũng', room: 'Nhà' },
    ],
    bars: [
      { label: 'T2', value: 90 },
      { label: 'T3', value: 70 },
      { label: 'T4', value: 100 },
      { label: 'T5', value: 80 },
      { label: 'T6', value: 72 },
    ],
    rewards: [
      { id: 'br1', title: 'Chọn món tối thứ Bảy', cost: 150 },
      { id: 'br2', title: '30 phút chơi game thêm', cost: 250 },
      { id: 'br3', title: 'Đi nhà sách cuối tuần', cost: 500 },
    ],
    goals: [
      { id: 'bg1', title: 'Tự giác hoàn thành việc nhà 4 tuần', note: 'Đã hoàn thành 3/4 tuần.', value: 75 },
      { id: 'bg2', title: 'Đọc hết 2 cuốn truyện trong tháng', note: 'Đang ở cuốn 2, còn 4 chương.', value: 84 },
    ],
  },
  {
    id: 'child2',
    name: 'Na',
    avatar: '👧',
    role: 'child',
    totalPoints: 280,
    weeklyPoints: 70,
    focusBadge: 'Năng động',
    tasks: [
      { id: 'n1', done: true, title: 'Tưới cây buổi sáng', meta: '+5 điểm', tags: ['Việc nhà'] },
      { id: 'n2', done: true, title: 'Tập thể dục 15 phút', meta: '+10 điểm', tags: ['Cá nhân'] },
      { id: 'n3', done: false, title: 'Ôn tập bài cũ Tiếng Anh', meta: '+15 điểm', tags: ['Học tập', 'Ưu tiên'] },
      { id: 'n4', done: false, title: 'Học vẽ tranh', meta: '+20 điểm', tags: ['Cá nhân'] },
      { id: 'n5', done: false, title: 'Giúp mẹ nấu cơm', meta: '+15 điểm', tags: ['Việc nhà', 'Cuối tuần'] },
    ],
    timeline: [
      { id: 'ns1', time: '06:30', title: 'Dậy sớm tập thể dục', note: 'Chạy bộ 15 phút quanh sân.', reminder: false },
      { id: 'ns2', time: '08:00', title: 'Lớp học ở trường', note: 'Mang theo bài tập Tiếng Anh.', reminder: true },
      { id: 'ns3', time: '15:00', title: 'Bơi lội', note: 'Lớp bơi tại hồ bơi khu đô thị.', reminder: false },
      { id: 'ns4', time: '18:30', title: 'Giúp mẹ nấu cơm', note: 'Phụ rửa rau và bày bàn ăn.', reminder: false },
    ],
    timetable: [
      { day: 'T2', time: '07:30', subject: 'Tiếng Việt', teacher: 'Cô Thu', room: 'P.102' },
      { day: 'T2', time: '09:00', subject: 'Toán', teacher: 'Thầy Hùng', room: 'P.201' },
      { day: 'T3', time: '07:30', subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'P.301' },
      { day: 'T3', time: '09:00', subject: 'Âm nhạc', teacher: 'Cô Yến', room: 'P.401' },
      { day: 'T4', time: '07:30', subject: 'Khoa học', teacher: 'Thầy Long', room: 'P.105' },
      { day: 'T4', time: '09:00', subject: 'Mỹ thuật', teacher: 'Cô Ngọc', room: 'P.502' },
      { day: 'T5', time: '07:30', subject: 'Toán', teacher: 'Thầy Hùng', room: 'P.201' },
      { day: 'T5', time: '09:00', subject: 'Đạo đức', teacher: 'Cô Thu', room: 'P.102' },
      { day: 'T6', time: '07:30', subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'P.301' },
      { day: 'T6', time: '15:00', subject: 'Bơi lội', teacher: 'HLV Phong', room: 'Hồ bơi' },
      { day: 'T7', time: '09:00', subject: 'Học vẽ', teacher: 'Thầy Đức', room: 'Trung tâm' },
    ],
    bars: [
      { label: 'T2', value: 100 },
      { label: 'T3', value: 85 },
      { label: 'T4', value: 60 },
      { label: 'T5', value: 90 },
      { label: 'T6', value: 75 },
    ],
    rewards: [
      { id: 'nr1', title: 'Chọn phim xem cuối tuần', cost: 100 },
      { id: 'nr2', title: 'Đi mua đồ vẽ mới', cost: 400 },
      { id: 'nr3', title: 'Chuyến đi công viên', cost: 700 },
    ],
    goals: [
      { id: 'ng1', title: 'Đạt giải vẽ tranh cuối kỳ', note: 'Luyện tập mỗi ngày 30 phút.', value: 50 },
      { id: 'ng2', title: 'Hoàn thành khóa bơi nâng cao', note: 'Đã qua 6/10 buổi.', value: 60 },
    ],
  },
];
