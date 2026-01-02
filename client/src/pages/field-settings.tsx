import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Settings,
  Eye,
  EyeOff,
  Folder,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Save,
  X,
} from "lucide-react";

interface CustomFieldGroup {
  id: string;
  name: string;
  nameAr: string;
  order: number;
  isVisible: boolean;
  icon?: string;
  color?: string;
}

interface CustomField {
  id: string;
  groupId?: string;
  name: string;
  nameAr: string;
  fieldType: string;
  order: number;
  isVisible: boolean;
  isRequired: boolean;
  defaultValue?: string;
  options?: string[];
}

const fieldTypeOptions = [
  { value: "text", label: "نص", icon: Type },
  { value: "number", label: "رقم", icon: Hash },
  { value: "date", label: "تاريخ", icon: Calendar },
  { value: "boolean", label: "نعم/لا", icon: ToggleLeft },
  { value: "select", label: "اختيار", icon: List },
];

const iconOptions = [
  "User", "CreditCard", "Phone", "Lock", "FileText", "Shield", "Globe", "Mail", "Home", "Car"
];

const colorOptions = [
  { value: "blue", bg: "bg-blue-500" },
  { value: "green", bg: "bg-green-500" },
  { value: "purple", bg: "bg-purple-500" },
  { value: "orange", bg: "bg-orange-500" },
  { value: "red", bg: "bg-red-500" },
  { value: "teal", bg: "bg-teal-500" },
  { value: "pink", bg: "bg-pink-500" },
  { value: "indigo", bg: "bg-indigo-500" },
];

export default function FieldSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [groups, setGroups] = useState<CustomFieldGroup[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomFieldGroup | null>(null);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState({
    name: "",
    nameAr: "",
    icon: "Folder",
    color: "blue",
    isVisible: true,
  });

  const [fieldForm, setFieldForm] = useState({
    name: "",
    nameAr: "",
    fieldType: "text",
    isVisible: true,
    isRequired: false,
    defaultValue: "",
    options: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, fieldsRes] = await Promise.all([
        fetch("/api/field-groups"),
        fetch("/api/fields"),
      ]);
      const groupsData = await groupsRes.json();
      const fieldsData = await fieldsRes.json();
      setGroups(groupsData);
      setFields(fieldsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "خطأ", description: "فشل في تحميل البيانات", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSaveGroup = async () => {
    try {
      const payload = {
        name: groupForm.name,
        nameAr: groupForm.nameAr,
        icon: groupForm.icon,
        color: groupForm.color,
        isVisible: groupForm.isVisible,
        order: editingGroup ? editingGroup.order : groups.length,
      };

      if (editingGroup) {
        await fetch(`/api/field-groups/${editingGroup.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast({ title: "تم التحديث", description: "تم تحديث المجموعة بنجاح" });
      } else {
        await fetch("/api/field-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast({ title: "تمت الإضافة", description: "تمت إضافة المجموعة بنجاح" });
      }
      
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      setGroupForm({ name: "", nameAr: "", icon: "Folder", color: "blue", isVisible: true });
      fetchData();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حفظ المجموعة", variant: "destructive" });
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة وجميع حقولها؟")) return;
    try {
      await fetch(`/api/field-groups/${id}`, { method: "DELETE" });
      toast({ title: "تم الحذف", description: "تم حذف المجموعة بنجاح" });
      fetchData();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف المجموعة", variant: "destructive" });
    }
  };

  const handleSaveField = async () => {
    try {
      const payload = {
        name: fieldForm.name,
        nameAr: fieldForm.nameAr,
        fieldType: fieldForm.fieldType,
        isVisible: fieldForm.isVisible,
        isRequired: fieldForm.isRequired,
        defaultValue: fieldForm.defaultValue || null,
        options: fieldForm.options ? fieldForm.options.split(",").map(o => o.trim()) : null,
        groupId: selectedGroupId,
        order: editingField ? editingField.order : fields.filter(f => f.groupId === selectedGroupId).length,
      };

      if (editingField) {
        await fetch(`/api/fields/${editingField.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast({ title: "تم التحديث", description: "تم تحديث الحقل بنجاح" });
      } else {
        await fetch("/api/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast({ title: "تمت الإضافة", description: "تمت إضافة الحقل بنجاح" });
      }
      
      setIsFieldDialogOpen(false);
      setEditingField(null);
      setFieldForm({ name: "", nameAr: "", fieldType: "text", isVisible: true, isRequired: false, defaultValue: "", options: "" });
      fetchData();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حفظ الحقل", variant: "destructive" });
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحقل؟")) return;
    try {
      await fetch(`/api/fields/${id}`, { method: "DELETE" });
      toast({ title: "تم الحذف", description: "تم حذف الحقل بنجاح" });
      fetchData();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف الحقل", variant: "destructive" });
    }
  };

  const handleToggleGroupVisibility = async (group: CustomFieldGroup) => {
    try {
      await fetch(`/api/field-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !group.isVisible }),
      });
      fetchData();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تحديث الحالة", variant: "destructive" });
    }
  };

  const handleToggleFieldVisibility = async (field: CustomField) => {
    try {
      await fetch(`/api/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !field.isVisible }),
      });
      fetchData();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تحديث الحالة", variant: "destructive" });
    }
  };

  const openEditGroup = (group: CustomFieldGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      nameAr: group.nameAr,
      icon: group.icon || "Folder",
      color: group.color || "blue",
      isVisible: group.isVisible,
    });
    setIsGroupDialogOpen(true);
  };

  const openAddField = (groupId: string) => {
    setSelectedGroupId(groupId);
    setEditingField(null);
    setFieldForm({ name: "", nameAr: "", fieldType: "text", isVisible: true, isRequired: false, defaultValue: "", options: "" });
    setIsFieldDialogOpen(true);
  };

  const openEditField = (field: CustomField) => {
    setEditingField(field);
    setSelectedGroupId(field.groupId || null);
    setFieldForm({
      name: field.name,
      nameAr: field.nameAr,
      fieldType: field.fieldType,
      isVisible: field.isVisible,
      isRequired: field.isRequired,
      defaultValue: field.defaultValue || "",
      options: field.options?.join(", ") || "",
    });
    setIsFieldDialogOpen(true);
  };

  const getFieldsForGroup = (groupId: string) => {
    return fields.filter(f => f.groupId === groupId).sort((a, b) => a.order - b.order);
  };

  const getFieldTypeIcon = (type: string) => {
    const option = fieldTypeOptions.find(o => o.value === type);
    return option ? option.icon : Type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowRight size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="text-primary" size={24} />
              <h1 className="text-xl font-bold text-foreground">إعدادات الحقول</h1>
            </div>
          </div>
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingGroup(null);
                  setGroupForm({ name: "", nameAr: "", icon: "Folder", color: "blue", isVisible: true });
                }}
                data-testid="button-add-group"
              >
                <Plus size={16} className="ml-2" />
                إضافة مجموعة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingGroup ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الاسم (بالإنجليزية)</Label>
                  <Input
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="basicInfo"
                    data-testid="input-group-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (بالعربية)</Label>
                  <Input
                    value={groupForm.nameAr}
                    onChange={(e) => setGroupForm({ ...groupForm, nameAr: e.target.value })}
                    placeholder="المعلومات الأساسية"
                    data-testid="input-group-name-ar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اللون</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-8 h-8 rounded-full ${color.bg} ${
                          groupForm.color === color.value ? "ring-2 ring-offset-2 ring-primary" : ""
                        }`}
                        onClick={() => setGroupForm({ ...groupForm, color: color.value })}
                        data-testid={`color-${color.value}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>مرئي</Label>
                  <Switch
                    checked={groupForm.isVisible}
                    onCheckedChange={(checked) => setGroupForm({ ...groupForm, isVisible: checked })}
                    data-testid="switch-group-visible"
                  />
                </div>
                <Button onClick={handleSaveGroup} className="w-full" data-testid="button-save-group">
                  <Save size={16} className="ml-2" />
                  حفظ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-4">
            {groups.length === 0 ? (
              <Card className="p-8 text-center">
                <Folder className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">لا توجد مجموعات. ابدأ بإضافة مجموعة جديدة.</p>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {groups.map((group) => (
                  <AccordionItem
                    key={group.id}
                    value={group.id}
                    className="border border-border rounded-lg overflow-hidden bg-card"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical size={16} className="text-muted-foreground cursor-grab" />
                        <div
                          className={`w-3 h-3 rounded-full bg-${group.color || "blue"}-500`}
                          style={{ backgroundColor: `var(--${group.color || "blue"}-500, #3b82f6)` }}
                        />
                        <span className="font-medium text-foreground">{group.nameAr}</span>
                        <span className="text-xs text-muted-foreground">({group.name})</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {getFieldsForGroup(group.id).length} حقل
                        </span>
                        {!group.isVisible && (
                          <EyeOff size={14} className="text-muted-foreground" />
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="flex gap-2 mb-4 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditGroup(group)}
                          data-testid={`button-edit-group-${group.id}`}
                        >
                          <Edit size={14} className="ml-1" /> تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleGroupVisibility(group)}
                          data-testid={`button-toggle-group-${group.id}`}
                        >
                          {group.isVisible ? <EyeOff size={14} className="ml-1" /> : <Eye size={14} className="ml-1" />}
                          {group.isVisible ? "إخفاء" : "إظهار"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteGroup(group.id)}
                          data-testid={`button-delete-group-${group.id}`}
                        >
                          <Trash2 size={14} className="ml-1" /> حذف
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openAddField(group.id)}
                          data-testid={`button-add-field-${group.id}`}
                        >
                          <Plus size={14} className="ml-1" /> إضافة حقل
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {getFieldsForGroup(group.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            لا توجد حقول في هذه المجموعة
                          </p>
                        ) : (
                          getFieldsForGroup(group.id).map((field) => {
                            const FieldIcon = getFieldTypeIcon(field.fieldType);
                            return (
                              <div
                                key={field.id}
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                              >
                                <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                                <FieldIcon size={16} className="text-primary" />
                                <div className="flex-1">
                                  <span className="font-medium text-sm">{field.nameAr}</span>
                                  <span className="text-xs text-muted-foreground mr-2">({field.name})</span>
                                </div>
                                <span className="text-xs bg-background px-2 py-0.5 rounded">
                                  {fieldTypeOptions.find(o => o.value === field.fieldType)?.label}
                                </span>
                                {field.isRequired && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">مطلوب</span>
                                )}
                                {!field.isVisible && <EyeOff size={14} className="text-muted-foreground" />}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleToggleFieldVisibility(field)}
                                  data-testid={`button-toggle-field-${field.id}`}
                                >
                                  {field.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => openEditField(field)}
                                  data-testid={`button-edit-field-${field.id}`}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleDeleteField(field.id)}
                                  data-testid={`button-delete-field-${field.id}`}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </main>

      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingField ? "تعديل الحقل" : "إضافة حقل جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>الاسم (بالإنجليزية)</Label>
              <Input
                value={fieldForm.name}
                onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                placeholder="fullName"
                data-testid="input-field-name"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم (بالعربية)</Label>
              <Input
                value={fieldForm.nameAr}
                onChange={(e) => setFieldForm({ ...fieldForm, nameAr: e.target.value })}
                placeholder="الاسم الكامل"
                data-testid="input-field-name-ar"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع الحقل</Label>
              <Select
                value={fieldForm.fieldType}
                onValueChange={(value) => setFieldForm({ ...fieldForm, fieldType: value })}
              >
                <SelectTrigger data-testid="select-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldForm.fieldType === "select" && (
              <div className="space-y-2">
                <Label>الخيارات (مفصولة بفاصلة)</Label>
                <Input
                  value={fieldForm.options}
                  onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                  placeholder="خيار1, خيار2, خيار3"
                  data-testid="input-field-options"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>القيمة الافتراضية</Label>
              <Input
                value={fieldForm.defaultValue}
                onChange={(e) => setFieldForm({ ...fieldForm, defaultValue: e.target.value })}
                placeholder="اختياري"
                data-testid="input-field-default"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>مطلوب</Label>
              <Switch
                checked={fieldForm.isRequired}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, isRequired: checked })}
                data-testid="switch-field-required"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>مرئي</Label>
              <Switch
                checked={fieldForm.isVisible}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, isVisible: checked })}
                data-testid="switch-field-visible"
              />
            </div>
            <Button onClick={handleSaveField} className="w-full" data-testid="button-save-field">
              <Save size={16} className="ml-2" />
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
