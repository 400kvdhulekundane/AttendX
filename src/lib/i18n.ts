export type Language = "en" | "hi" | "mr";

type TranslationKeys = {
  // General
  appName: string;
  loading: string;
  save: string;
  cancel: string;
  submit: string;
  edit: string;
  delete: string;
  approve: string;
  reject: string;
  close: string;
  confirm: string;
  back: string;
  next: string;
  search: string;
  filter: string;
  export: string;
  refresh: string;
  retry: string;
  noData: string;
  error: string;
  success: string;
  warning: string;
  offline: string;
  syncing: string;
  syncDone: string;
  // Auth
  login: string;
  logout: string;
  register: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  rememberMe: string;
  fullName: string;
  employeeId: string;
  department: string;
  branch: string;
  profilePhoto: string;
  idCardPhoto: string;
  pendingApproval: string;
  pendingApprovalMsg: string;
  loginBtn: string;
  registerBtn: string;
  noAccount: string;
  haveAccount: string;
  // Dashboard
  dashboard: string;
  checkedIn: string;
  checkedOut: string;
  absent: string;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  duration: string;
  todayHours: string;
  weekHours: string;
  monthAttendance: string;
  activeBranch: string;
  gpsAccuracy: string;
  manualCheckIn: string;
  manualCheckOut: string;
  confirmCheckIn: string;
  confirmCheckOut: string;
  // Attendance
  attendance: string;
  present: string;
  late: string;
  halfDay: string;
  date: string;
  status: string;
  autoLabel: string;
  manualLabel: string;
  // Profile
  profile: string;
  myProfile: string;
  changePassword: string;
  geofenceRequest: string;
  submitGeofence: string;
  pendingRequests: string;
  // Notifications
  notifications: string;
  markAllRead: string;
  noNotifications: string;
  // Admin
  adminDashboard: string;
  totalEmployees: string;
  pendingCount: string;
  presentToday: string;
  absentToday: string;
  lateToday: string;
  employeeManagement: string;
  branchManagement: string;
  geofenceRequests: string;
  attendanceManagement: string;
  reportsExport: string;
  alertsSettings: string;
  workSchedules: string;
  addBranch: string;
  editBranch: string;
  branchName: string;
  branchAddress: string;
  radius: string;
  latitude: string;
  longitude: string;
  rejectionReason: string;
  approveEmployee: string;
  rejectEmployee: string;
  deactivate: string;
  reactivate: string;
  // Schedule
  lateThreshold: string;
  expectedHours: string;
  markAbsentAfter: string;
  workingDays: string;
  // Days
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  // Reports
  generateReport: string;
  downloadPdf: string;
  downloadExcel: string;
  dateRange: string;
  from: string;
  to: string;
};

const translations: Record<Language, TranslationKeys> = {
  en: {
    appName: "AttendX",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    edit: "Edit",
    delete: "Delete",
    approve: "Approve",
    reject: "Reject",
    close: "Close",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    search: "Search",
    filter: "Filter",
    export: "Export",
    refresh: "Refresh",
    retry: "Retry",
    noData: "No data available",
    error: "An error occurred",
    success: "Success",
    warning: "Warning",
    offline: "Offline – will sync when connected",
    syncing: "Syncing...",
    syncDone: "Synced",
    login: "Login",
    logout: "Logout",
    register: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    rememberMe: "Remember Me",
    fullName: "Full Name",
    employeeId: "Employee ID",
    department: "Department",
    branch: "Branch",
    profilePhoto: "Profile Photo",
    idCardPhoto: "ID Card Photo",
    pendingApproval: "Account Pending Approval",
    pendingApprovalMsg: "Your account is under review. You will be notified once approved.",
    loginBtn: "Sign In",
    registerBtn: "Create Account",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    dashboard: "Dashboard",
    checkedIn: "Checked In",
    checkedOut: "Checked Out",
    absent: "Absent",
    checkIn: "Check In",
    checkOut: "Check Out",
    checkInTime: "Check-in Time",
    checkOutTime: "Check-out Time",
    duration: "Duration",
    todayHours: "Today's Hours",
    weekHours: "This Week",
    monthAttendance: "Month Attendance",
    activeBranch: "Active Branch",
    gpsAccuracy: "GPS Accuracy",
    manualCheckIn: "Manual Check-in",
    manualCheckOut: "Manual Check-out",
    confirmCheckIn: "Confirm Check-in?",
    confirmCheckOut: "Confirm Check-out?",
    attendance: "Attendance",
    present: "Present",
    late: "Late",
    halfDay: "Half Day",
    date: "Date",
    status: "Status",
    autoLabel: "Auto",
    manualLabel: "Manual",
    profile: "Profile",
    myProfile: "My Profile",
    changePassword: "Change Password",
    geofenceRequest: "Geofence Request",
    submitGeofence: "Submit Geofence Request",
    pendingRequests: "Pending Requests",
    notifications: "Notifications",
    markAllRead: "Mark All Read",
    noNotifications: "No notifications yet",
    adminDashboard: "Admin Dashboard",
    totalEmployees: "Total Employees",
    pendingCount: "Pending",
    presentToday: "Present Today",
    absentToday: "Absent Today",
    lateToday: "Late Today",
    employeeManagement: "Employees",
    branchManagement: "Branches",
    geofenceRequests: "Geofence Requests",
    attendanceManagement: "Attendance",
    reportsExport: "Reports",
    alertsSettings: "Alerts",
    workSchedules: "Schedules",
    addBranch: "Add Branch",
    editBranch: "Edit Branch",
    branchName: "Branch Name",
    branchAddress: "Address",
    radius: "Radius (m)",
    latitude: "Latitude",
    longitude: "Longitude",
    rejectionReason: "Rejection Reason",
    approveEmployee: "Approve Employee",
    rejectEmployee: "Reject Employee",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    lateThreshold: "Late Threshold (min)",
    expectedHours: "Expected Hours/Day",
    markAbsentAfter: "Mark Absent After (min)",
    workingDays: "Working Days",
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    generateReport: "Generate Report",
    downloadPdf: "Download PDF",
    downloadExcel: "Download Excel",
    dateRange: "Date Range",
    from: "From",
    to: "To",
  },
  hi: {
    appName: "AttendX",
    loading: "लोड हो रहा है...",
    save: "सहेजें",
    cancel: "रद्द करें",
    submit: "जमा करें",
    edit: "संपादित करें",
    delete: "हटाएं",
    approve: "अनुमोदित करें",
    reject: "अस्वीकार करें",
    close: "बंद करें",
    confirm: "पुष्टि करें",
    back: "वापस",
    next: "अगला",
    search: "खोजें",
    filter: "फ़िल्टर",
    export: "निर्यात करें",
    refresh: "ताज़ा करें",
    retry: "पुनः प्रयास करें",
    noData: "कोई डेटा उपलब्ध नहीं",
    error: "एक त्रुटि हुई",
    success: "सफलता",
    warning: "चेतावनी",
    offline: "ऑफलाइन – कनेक्ट होने पर सिंक होगा",
    syncing: "सिंक हो रहा है...",
    syncDone: "सिंक हो गया",
    login: "लॉगिन",
    logout: "लॉगआउट",
    register: "रजिस्टर करें",
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    forgotPassword: "पासवर्ड भूल गए?",
    resetPassword: "पासवर्ड रीसेट करें",
    rememberMe: "मुझे याद रखें",
    fullName: "पूरा नाम",
    employeeId: "कर्मचारी आईडी",
    department: "विभाग",
    branch: "शाखा",
    profilePhoto: "प्रोफ़ाइल फ़ोटो",
    idCardPhoto: "आईडी कार्ड फ़ोटो",
    pendingApproval: "खाता अनुमोदन के लिए प्रतीक्षारत",
    pendingApprovalMsg: "आपका खाता समीक्षाधीन है। अनुमोदित होने पर आपको सूचित किया जाएगा।",
    loginBtn: "साइन इन करें",
    registerBtn: "खाता बनाएं",
    noAccount: "खाता नहीं है?",
    haveAccount: "पहले से खाता है?",
    dashboard: "डैशबोर्ड",
    checkedIn: "चेक इन",
    checkedOut: "चेक आउट",
    absent: "अनुपस्थित",
    checkIn: "चेक इन",
    checkOut: "चेक आउट",
    checkInTime: "चेक-इन समय",
    checkOutTime: "चेक-आउट समय",
    duration: "अवधि",
    todayHours: "आज के घंटे",
    weekHours: "इस सप्ताह",
    monthAttendance: "महीने की उपस्थिति",
    activeBranch: "सक्रिय शाखा",
    gpsAccuracy: "GPS सटीकता",
    manualCheckIn: "मैन्युअल चेक-इन",
    manualCheckOut: "मैन्युअल चेक-आउट",
    confirmCheckIn: "चेक-इन की पुष्टि करें?",
    confirmCheckOut: "चेक-आउट की पुष्टि करें?",
    attendance: "उपस्थिति",
    present: "उपस्थित",
    late: "देर से",
    halfDay: "आधा दिन",
    date: "तारीख",
    status: "स्थिति",
    autoLabel: "स्वतः",
    manualLabel: "मैन्युअल",
    profile: "प्रोफ़ाइल",
    myProfile: "मेरी प्रोफ़ाइल",
    changePassword: "पासवर्ड बदलें",
    geofenceRequest: "जियोफेंस अनुरोध",
    submitGeofence: "जियोफेंस अनुरोध जमा करें",
    pendingRequests: "लंबित अनुरोध",
    notifications: "सूचनाएं",
    markAllRead: "सभी पढ़ा हुआ मार्क करें",
    noNotifications: "अभी तक कोई सूचना नहीं",
    adminDashboard: "एडमिन डैशबोर्ड",
    totalEmployees: "कुल कर्मचारी",
    pendingCount: "लंबित",
    presentToday: "आज उपस्थित",
    absentToday: "आज अनुपस्थित",
    lateToday: "आज देर से",
    employeeManagement: "कर्मचारी",
    branchManagement: "शाखाएं",
    geofenceRequests: "जियोफेंस अनुरोध",
    attendanceManagement: "उपस्थिति",
    reportsExport: "रिपोर्ट",
    alertsSettings: "अलर्ट",
    workSchedules: "समय-सारणी",
    addBranch: "शाखा जोड़ें",
    editBranch: "शाखा संपादित करें",
    branchName: "शाखा का नाम",
    branchAddress: "पता",
    radius: "दायरा (मीटर)",
    latitude: "अक्षांश",
    longitude: "देशांतर",
    rejectionReason: "अस्वीकृति का कारण",
    approveEmployee: "कर्मचारी को अनुमोदित करें",
    rejectEmployee: "कर्मचारी को अस्वीकार करें",
    deactivate: "निष्क्रिय करें",
    reactivate: "पुनः सक्रिय करें",
    lateThreshold: "देर का सीमा (मिनट)",
    expectedHours: "अपेक्षित घंटे/दिन",
    markAbsentAfter: "अनुपस्थित के बाद (मिनट)",
    workingDays: "कार्य दिवस",
    sun: "रवि",
    mon: "सोम",
    tue: "मंगल",
    wed: "बुध",
    thu: "गुरु",
    fri: "शुक्र",
    sat: "शनि",
    generateReport: "रिपोर्ट बनाएं",
    downloadPdf: "PDF डाउनलोड करें",
    downloadExcel: "Excel डाउनलोड करें",
    dateRange: "तिथि सीमा",
    from: "से",
    to: "तक",
  },
  mr: {
    appName: "AttendX",
    loading: "लोड होत आहे...",
    save: "जतन करा",
    cancel: "रद्द करा",
    submit: "सादर करा",
    edit: "संपादित करा",
    delete: "हटवा",
    approve: "मंजूर करा",
    reject: "नाकारा",
    close: "बंद करा",
    confirm: "पुष्टी करा",
    back: "मागे",
    next: "पुढे",
    search: "शोधा",
    filter: "फिल्टर",
    export: "निर्यात करा",
    refresh: "रिफ्रेश करा",
    retry: "पुन्हा प्रयत्न करा",
    noData: "डेटा उपलब्ध नाही",
    error: "एक चूक झाली",
    success: "यश",
    warning: "इशारा",
    offline: "ऑफलाइन – कनेक्ट झाल्यावर सिंक होईल",
    syncing: "सिंक होत आहे...",
    syncDone: "सिंक झाले",
    login: "लॉगिन",
    logout: "लॉगआउट",
    register: "नोंदणी करा",
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड पुष्टी करा",
    forgotPassword: "पासवर्ड विसरलात?",
    resetPassword: "पासवर्ड रीसेट करा",
    rememberMe: "मला लक्षात ठेवा",
    fullName: "पूर्ण नाव",
    employeeId: "कर्मचारी आयडी",
    department: "विभाग",
    branch: "शाखा",
    profilePhoto: "प्रोफाइल फोटो",
    idCardPhoto: "आयडी कार्ड फोटो",
    pendingApproval: "खाते मंजुरीच्या प्रतीक्षेत",
    pendingApprovalMsg: "तुमचे खाते पुनरावलोकनाधीन आहे. मंजूर झाल्यावर तुम्हाला कळवले जाईल.",
    loginBtn: "साइन इन करा",
    registerBtn: "खाते तयार करा",
    noAccount: "खाते नाही?",
    haveAccount: "आधीपासून खाते आहे?",
    dashboard: "डॅशबोर्ड",
    checkedIn: "चेक इन",
    checkedOut: "चेक आउट",
    absent: "अनुपस्थित",
    checkIn: "चेक इन",
    checkOut: "चेक आउट",
    checkInTime: "चेक-इन वेळ",
    checkOutTime: "चेक-आउट वेळ",
    duration: "कालावधी",
    todayHours: "आजचे तास",
    weekHours: "या आठवड्यात",
    monthAttendance: "महिन्याची उपस्थिती",
    activeBranch: "सक्रिय शाखा",
    gpsAccuracy: "GPS अचूकता",
    manualCheckIn: "मॅन्युअल चेक-इन",
    manualCheckOut: "मॅन्युअल चेक-आउट",
    confirmCheckIn: "चेक-इन पुष्टी करा?",
    confirmCheckOut: "चेक-आउट पुष्टी करा?",
    attendance: "उपस्थिती",
    present: "उपस्थित",
    late: "उशिरा",
    halfDay: "अर्धा दिवस",
    date: "तारीख",
    status: "स्थिती",
    autoLabel: "स्वयं",
    manualLabel: "मॅन्युअल",
    profile: "प्रोफाइल",
    myProfile: "माझे प्रोफाइल",
    changePassword: "पासवर्ड बदला",
    geofenceRequest: "जिओफेन्स विनंती",
    submitGeofence: "जिओफेन्स विनंती सादर करा",
    pendingRequests: "प्रलंबित विनंत्या",
    notifications: "सूचना",
    markAllRead: "सर्व वाचले म्हणून चिन्हांकित करा",
    noNotifications: "अद्याप कोणतीही सूचना नाही",
    adminDashboard: "एडमिन डॅशबोर्ड",
    totalEmployees: "एकूण कर्मचारी",
    pendingCount: "प्रलंबित",
    presentToday: "आज उपस्थित",
    absentToday: "आज अनुपस्थित",
    lateToday: "आज उशिरा",
    employeeManagement: "कर्मचारी",
    branchManagement: "शाखा",
    geofenceRequests: "जिओफेन्स विनंत्या",
    attendanceManagement: "उपस्थिती",
    reportsExport: "अहवाल",
    alertsSettings: "अलर्ट",
    workSchedules: "वेळापत्रक",
    addBranch: "शाखा जोडा",
    editBranch: "शाखा संपादित करा",
    branchName: "शाखेचे नाव",
    branchAddress: "पत्ता",
    radius: "त्रिज्या (मीटर)",
    latitude: "अक्षांश",
    longitude: "रेखांश",
    rejectionReason: "नाकारण्याचे कारण",
    approveEmployee: "कर्मचारी मंजूर करा",
    rejectEmployee: "कर्मचारी नाकारा",
    deactivate: "निष्क्रिय करा",
    reactivate: "पुन्हा सक्रिय करा",
    lateThreshold: "उशिराची मर्यादा (मिनिटे)",
    expectedHours: "अपेक्षित तास/दिवस",
    markAbsentAfter: "नंतर अनुपस्थित चिन्हांकित करा (मिनिटे)",
    workingDays: "कामाचे दिवस",
    sun: "रवि",
    mon: "सोम",
    tue: "मंगळ",
    wed: "बुध",
    thu: "गुरु",
    fri: "शुक्र",
    sat: "शनि",
    generateReport: "अहवाल तयार करा",
    downloadPdf: "PDF डाउनलोड करा",
    downloadExcel: "Excel डाउनलोड करा",
    dateRange: "तारीख श्रेणी",
    from: "पासून",
    to: "पर्यंत",
  },
};

export function t(lang: Language, key: keyof TranslationKeys): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

export { translations };
