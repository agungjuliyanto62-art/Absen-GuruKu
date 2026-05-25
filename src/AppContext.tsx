import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  getDoc,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { 
  User, 
  AttendanceRecord, 
  Notification, 
  ActivityReport, 
  LeaveRequest, 
  OvertimeRequest, 
  ShiftRequest, 
  CalendarReminder, 
  Post, 
  PostReply,
  LearningMedia, 
  NewsItem, 
  SchoolSettings, 
  SchoolProfile 
} from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanObject<T extends object>(obj: T): T {
  const result = { ...obj } as any;
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });
  return result;
}

interface AppContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  attendanceData: AttendanceRecord[];
  notifications: Notification[];
  activities: ActivityReport[];
  leaveRequests: LeaveRequest[];
  overtimeRequests: OvertimeRequest[];
  shiftRequests: ShiftRequest[];
  reminders: CalendarReminder[];
  posts: Post[];
  users: User[];
  learningMedia: LearningMedia[];
  news: NewsItem[];
  settings: SchoolSettings;
  schoolProfile: SchoolProfile;
  login: (id: string, password: string, requiredRole: 'admin' | 'teacher') => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
  addUser: (newUser: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  updateOvertimeStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  updateActivityStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  clockIn: (photo: string, location: string, security?: { isMocked?: boolean, accuracy?: number, violationType?: 'fake_gps' | 'low_accuracy' | 'outside_radius' }) => Promise<void>;
  clockOut: (photo: string, location: string, security?: { isMocked?: boolean, accuracy?: number, violationType?: 'fake_gps' | 'low_accuracy' | 'outside_radius' }) => Promise<void>;
  addActivity: (activity: Omit<ActivityReport, 'id' | 'status'>) => Promise<void>;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status'>) => Promise<void>;
  addOvertimeRequest: (request: Omit<OvertimeRequest, 'id' | 'status'>) => Promise<void>;
  addShiftRequest: (request: Omit<ShiftRequest, 'id' | 'status'>) => Promise<void>;
  addReminder: (reminder: Omit<CalendarReminder, 'id'>) => Promise<void>;
  updateReminder: (reminder: CalendarReminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  addPost: (content: string, image?: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  updatePost: (id: string, content: string, image?: string) => Promise<void>;
  toggleLikePost: (id: string) => Promise<void>;
  addReply: (postId: string, content: string) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SchoolSettings>) => Promise<void>;
  addNews: (news: Omit<NewsItem, 'id'>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addMedia: (media: Omit<LearningMedia, 'id'>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  updateSchoolProfile: (newProfile: SchoolProfile) => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityReport[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [reminders, setReminders] = useState<CalendarReminder[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [learningMedia, setLearningMedia] = useState<LearningMedia[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>({
    radius: 100,
    center: { lat: -6.2088, lng: 106.8456 },
    locationName: 'SMPN Tulang Bawang',
    runningText: 'Selamat Datang di Aplikasi Absensi Digital SMPN Tulang Bawang',
    workHours: {
      entryStart: '06:30',
      entryEnd: '08:00',
      exitStart: '15:00',
      exitEnd: '17:00'
    }
  });
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    name: 'SMPN Tulang Bawang',
    address: 'Jl. Raya Tulang Bawang No. 123, Kabupaten Tulang Bawang, Lampung',
    phone: '0721-123456',
    email: 'info@smpntulangbawang.sch.id',
    website: 'www.smpntulangbawang.sch.id',
    vision: 'Mewujudkan generasi yang bertaqwa, cerdas, terampil dan berbudaya lingkungan.',
    mission: [
      'Menanamkan keyakinan ketaqwaan melalui pengamalan ajaran agama.',
      'Melaksanakan pembelajaran dan bimbingan secara efektif.',
      'Mendorong dan membantu setiap siswa untuk mengenali potensi dirinya.',
      'Menerapkan manajemen partisipatif dengan seluruh warga sekolah.'
    ],
    headmaster: 'Drs. H. Ahmad Fauzi, M.Pd.'
  });

  // Test connection on boot and Seed Data
  useEffect(() => {
    async function init() {
      try {
        console.log('🚀 Starting Initialization...');
        
        // Seed School Settings
        console.log('Checking school settings...');
        const settingsDoc = await getDoc(doc(db, 'settings', 'school'));
        if (!settingsDoc.exists()) {
          console.log('Seeding school settings...');
          await setDoc(doc(db, 'settings', 'school'), settings);
          console.log('✅ Default settings seeded');
        } else {
          setSettings(settingsDoc.data() as SchoolSettings);
        }

        // Seed School Profile
        console.log('Checking school profile...');
        const profileDoc = await getDoc(doc(db, 'profile', 'school'));
        if (!profileDoc.exists()) {
          console.log('Seeding school profile...');
          await setDoc(doc(db, 'profile', 'school'), schoolProfile);
          console.log('✅ Default profile seeded');
        } else {
          setSchoolProfile(profileDoc.data() as SchoolProfile);
        }
        
        // Seed Admin user if not exists
        console.log('Checking admin user...');
        const adminId = 'admin_001';
        try {
          const adminDoc = await getDoc(doc(db, 'users', adminId));
          if (!adminDoc.exists()) {
            console.log('Checking if admin employeeId 123 exists...');
            const q = query(collection(db, 'users'), where('employeeId', '==', '123'));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
              console.log('Seeding admin 123...');
              await setDoc(doc(db, 'users', adminId), {
                id: adminId,
                name: 'Administrator',
                role: 'admin',
                department: 'IT',
                employeeId: '123',
                password: '123',
                status: 'active',
                avatar: `https://ui-avatars.com/api/?name=Administrator&background=random`,
                joinDate: new Date().toISOString().split('T')[0],
                location: { lat: -6.2088, lng: 106.8456, address: 'SMPN Tulang Bawang' }
              });
              console.log('✅ Admin user 123 created');
            }
          }
        } catch (adminErr) {
          console.error("Admin Seed Error (Proceeding):", adminErr);
        }
      } catch (error) {
        console.error("Initialization Error:", error);
      } finally {
        console.log('🏁 Initialization Complete');
        setTimeout(() => setLoading(false), 1000);
      }
    }
    init();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            const q = query(collection(db, 'users'), where('employeeId', '==', fbUser.email?.split('@')[0] || ''));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              setUser(querySnapshot.docs[0].data() as User);
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!isSignedIn()) return;

    const unsubscribers = [
      onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users')),

      onSnapshot(collection(db, 'attendance'), (snapshot) => {
        setAttendanceData(snapshot.docs.map(doc => doc.data() as AttendanceRecord).sort((a, b) => b.date.localeCompare(a.date)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'attendance')),

      onSnapshot(collection(db, 'activities'), (snapshot) => {
        setActivities(snapshot.docs.map(doc => doc.data() as ActivityReport));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'activities')),

      onSnapshot(collection(db, 'leaveRequests'), (snapshot) => {
        setLeaveRequests(snapshot.docs.map(doc => doc.data() as LeaveRequest));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'leaveRequests')),

      onSnapshot(collection(db, 'overtimeRequests'), (snapshot) => {
        setOvertimeRequests(snapshot.docs.map(doc => doc.data() as OvertimeRequest));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'overtimeRequests')),

      onSnapshot(collection(db, 'shiftRequests'), (snapshot) => {
        setShiftRequests(snapshot.docs.map(doc => doc.data() as ShiftRequest));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'shiftRequests')),

      onSnapshot(collection(db, 'reminders'), (snapshot) => {
        setReminders(snapshot.docs.map(doc => doc.data() as CalendarReminder));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'reminders')),

      onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc')), (snapshot) => {
        setPosts(snapshot.docs.map(doc => doc.data() as Post));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts')),

      onSnapshot(collection(db, 'learningMedia'), (snapshot) => {
        setLearningMedia(snapshot.docs.map(doc => doc.data() as LearningMedia));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'learningMedia')),

      onSnapshot(collection(db, 'news'), (snapshot) => {
        setNews(snapshot.docs.map(doc => doc.data() as NewsItem));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'news')),

      onSnapshot(doc(db, 'settings', 'school'), (doc) => {
        if (doc.exists()) setSettings(doc.data() as SchoolSettings);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/school')),

      onSnapshot(doc(db, 'profile', 'school'), (doc) => {
        if (doc.exists()) setSchoolProfile(doc.data() as SchoolProfile);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'profile/school')),

      onSnapshot(collection(db, 'notifications'), (snapshot) => {
        setNotifications(snapshot.docs.map(doc => doc.data() as Notification));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [firebaseUser, user]);

  const isSignedIn = () => !!auth.currentUser || !!user;

  const login = async (id: string, password: string, requiredRole: 'admin' | 'teacher'): Promise<boolean> => {
    try {
      const cleanId = id.trim();
      const q = query(collection(db, 'users'), where('employeeId', '==', cleanId), where('role', '==', requiredRole));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const foundUser = querySnapshot.docs[0].data() as User;
        if (foundUser.password === password) {
          setUser(foundUser);
          return true;
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      throw err;
    }
    return false;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
    }
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
    localStorage.removeItem('userRole');
  };

  const addUser = async (newUser: Omit<User, 'id'>) => {
    const id = Date.now().toString();
    const userWithId: User = { 
      ...newUser, 
      id,
      joinDate: (newUser as any).joinDate || new Date().toISOString().split('T')[0],
      avatar: (newUser as any).avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`
    };
    try {
      await setDoc(doc(db, 'users', id), cleanObject(userWithId));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `users/${id}`); }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await updateDoc(doc(db, 'users', updatedUser.id), cleanObject({ ...updatedUser }));
      if (user?.id === updatedUser.id) {
        setUser(updatedUser);
      }
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `users/${updatedUser.id}`); }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `users/${id}`); }
  };

  const updateSettings = async (newSettings: Partial<SchoolSettings>) => {
    try {
      await updateDoc(doc(db, 'settings', 'school'), cleanObject(newSettings as any));
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, 'settings/school'); }
  };

  const addNews = async (newsItem: Omit<NewsItem, 'id'>) => {
    const id = Date.now().toString();
    const newNews: NewsItem = { ...newsItem, id };
    try {
      await setDoc(doc(db, 'news', id), cleanObject(newNews));
      
      // Create notification for everyone
      const notificationId = Date.now().toString() + '_notif';
      const newNotification: Notification = {
        id: notificationId,
        title: newsItem.category === 'PENGUMUMAN' ? 'Pengumuman Baru' : 'Berita Baru',
        message: newsItem.title,
        date: new Date().toISOString(),
        isRead: false,
        type: newsItem.category === 'PENGUMUMAN' ? 'announcement' : 'news'
      };
      await setDoc(doc(db, 'notifications', notificationId), cleanObject(newNotification));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `news/${id}`); }
  };

  const deleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `news/${id}`); }
  };

  const addMedia = async (mediaItem: Omit<LearningMedia, 'id'>) => {
    const id = Date.now().toString();
    const newMedia: LearningMedia = { ...mediaItem, id };
    try {
      await setDoc(doc(db, 'learningMedia', id), cleanObject(newMedia));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `learningMedia/${id}`); }
  };

  const deleteMedia = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'learningMedia', id));
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `learningMedia/${id}`); }
  };

  const updateSchoolProfile = async (newProfile: SchoolProfile) => {
    try {
      await setDoc(doc(db, 'profile', 'school'), newProfile);
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'profile/school'); }
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'leaveRequests', id), { status });
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `leaveRequests/${id}`); }
  };

  const updateOvertimeStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'overtimeRequests', id), { status });
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `overtimeRequests/${id}`); }
  };

  const updateActivityStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'activities', id), { status });
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `activities/${id}`); }
  };

  const clockIn = async (photo: string, location: string, security?: { isMocked?: boolean, accuracy?: number, violationType?: 'fake_gps' | 'low_accuracy' | 'outside_radius' }) => {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const id = Date.now().toString();

    const newRecord: AttendanceRecord = {
      id,
      userId: user?.id || '1',
      date: today,
      clockIn: timeNow,
      clockOut: null,
      status: 'hadir',
      photoIn: photo,
      locationIn: location,
      ...security
    };
    try {
      await setDoc(doc(db, 'attendance', id), cleanObject(newRecord));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `attendance/${id}`); }
  };

  const clockOut = async (photo: string, location: string, security?: { isMocked?: boolean, accuracy?: number, violationType?: 'fake_gps' | 'low_accuracy' | 'outside_radius' }) => {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const record = attendanceData.find(r => r.date === today && r.userId === user?.id);
    if (record) {
      try {
        await updateDoc(doc(db, 'attendance', record.id), cleanObject({
          clockOut: timeNow,
          photoOut: photo,
          locationOut: location,
          ...security
        }));
      } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `attendance/${record.id}`); }
    }
  };

  const addActivity = async (activity: Omit<ActivityReport, 'id' | 'status'>) => {
    const id = Date.now().toString();
    const newActivity: ActivityReport = {
      ...activity,
      id,
      status: 'pending',
    };
    try {
      await setDoc(doc(db, 'activities', id), cleanObject(newActivity));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `activities/${id}`); }
  };


  const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    const id = Date.now().toString();
    const newRequest: LeaveRequest = {
      ...request,
      id,
      status: 'pending',
    };
    try {
      await setDoc(doc(db, 'leaveRequests', id), cleanObject(newRequest));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `leaveRequests/${id}`); }
  };

  const addOvertimeRequest = async (request: Omit<OvertimeRequest, 'id' | 'status'>) => {
    const id = Date.now().toString();
    const newRequest: OvertimeRequest = {
      ...request,
      id,
      status: 'pending',
    };
    try {
      await setDoc(doc(db, 'overtimeRequests', id), cleanObject(newRequest));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `overtimeRequests/${id}`); }
  };

  const addShiftRequest = async (request: Omit<ShiftRequest, 'id' | 'status'>) => {
    const id = Date.now().toString();
    const newRequest: ShiftRequest = {
      ...request,
      id,
      status: 'pending',
    };
    try {
      await setDoc(doc(db, 'shiftRequests', id), cleanObject(newRequest));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `shiftRequests/${id}`); }
  };

  const addReminder = async (reminder: Omit<CalendarReminder, 'id'>) => {
    const id = Date.now().toString();
    const newReminder: CalendarReminder = { ...reminder, id };
    try {
      await setDoc(doc(db, 'reminders', id), cleanObject(newReminder));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `reminders/${id}`); }
  };

  const updateReminder = async (updatedReminder: CalendarReminder) => {
    try {
      await updateDoc(doc(db, 'reminders', updatedReminder.id), cleanObject({ ...updatedReminder }));
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `reminders/${updatedReminder.id}`); }
  };

  const deleteReminder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `reminders/${id}`); }
  };

  const addPost = async (content: string, image?: string) => {
    if (!user) return;
    const id = Date.now().toString();
    const newPost: Post = {
      id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      content,
      image: image || undefined,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };
    try {
      await setDoc(doc(db, 'posts', id), cleanObject(newPost));
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, `posts/${id}`); }
  };


  const deletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `posts/${id}`); }
  };

  const updatePost = async (id: string, content: string, image?: string) => {
    try {
      await updateDoc(doc(db, 'posts', id), cleanObject({ content, image }));
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `posts/${id}`); }
  };


  const toggleLikePost = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post) {
      try {
        await updateDoc(doc(db, 'posts', id), {
          likes: post.isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
          isLiked: !post.isLiked
        });
      } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `posts/${id}`); }
    }
  };

  const addReply = async (postId: string, content: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (post) {
      const reply: PostReply = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        content,
        timestamp: new Date().toISOString()
      };
      
      try {
        const currentReplies = post.replies || [];
        await updateDoc(doc(db, 'posts', postId), {
          replies: [...currentReplies, reply]
        });
      } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`); }
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'activities', id));
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `activities/${id}`); }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      firebaseUser,
      attendanceData, 
      notifications, 
      activities, 
      leaveRequests,
      overtimeRequests,
      shiftRequests,
      reminders,
      posts,
      users,
      learningMedia,
      news,
      settings,
      schoolProfile,
      login,
      loginWithGoogle,
      logout,
      updateUser,
      addUser,
      deleteUser,
      updateLeaveStatus,
      updateOvertimeStatus,
      updateActivityStatus,
      clockIn, 
      clockOut,
      addActivity,
      deleteActivity,
      addLeaveRequest,
      addOvertimeRequest,
      addShiftRequest,
      addReminder,
      updateReminder,
      deleteReminder,
      addPost,
      deletePost,
      updatePost,
      toggleLikePost,
      addReply,
      updateSettings,
      addNews,
      deleteNews,
      addMedia,
      deleteMedia,
      updateSchoolProfile,
      loading 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

