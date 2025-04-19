// app/[locale]/dashboard/community/groups/create/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { CommunityService } from '@/services/CommunityService';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

const CreateStudyGroupPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useParams();
  const isRTL = locale === "ar";

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false,
    subject_id: '',
    grade_level: ''
  });

  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // In a real app, fetch subjects
    setSubjects([
      { id: 1, name: 'Mathematics' },
      { id: 2, name: 'Physics' },
      { id: 3, name: 'Chemistry' },
      { id: 4, name: 'Biology' },
      { id: 5, name: 'Arabic' },
      { id: 6, name: 'French' },
      { id: 7, name: 'English' },
      { id: 8, name: 'History' },
      { id: 9, name: 'Geography' },
    ]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleSwitchChange = (checked) => {
    setFormData({
      ...formData,
      is_private: checked
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("nameRequired") || "Group name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = t("descriptionRequired") || "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await CommunityService.createStudyGroup(formData);
      router.push(`/${locale}/dashboard/community/groups/${response.id}`);
    } catch (error) {
      console.error("Failed to create group:", error);
      setErrors({
        ...errors,
        submit: t("createGroupError") || "Failed to create group. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/community/groups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back") || "Back"}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{t("createStudyGroup") || "Create a New Study Group"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("groupDetails") || "Group Details"}</CardTitle>
          <CardDescription>
            {t("groupDetailsDesc") || "Fill in the information below to create your study group"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("groupName") || "Group Name"} *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t("groupNamePlaceholder") || "Enter a name for your study group"}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description") || "Description"} *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t("descriptionPlaceholder") || "Describe what your group is about"}
                className={errors.description ? "border-red-500" : ""}
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t("subject") || "Subject"}</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) => handleSelectChange('subject_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSubject") || "Select a subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_level">{t("gradeLevel") || "Grade Level"}</Label>
              <Select
                value={formData.grade_level}
                onValueChange={(value) => handleSelectChange('grade_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectGradeLevel") || "Select a grade level"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary_1">{t("primary1") || "Primary 1"}</SelectItem>
                  <SelectItem value="primary_2">{t("primary2") || "Primary 2"}</SelectItem>
                  <SelectItem value="primary_3">{t("primary3") || "Primary 3"}</SelectItem>
                  <SelectItem value="primary_4">{t("primary4") || "Primary 4"}</SelectItem>
                  <SelectItem value="primary_5">{t("primary5") || "Primary 5"}</SelectItem>
                  <SelectItem value="primary_6">{t("primary6") || "Primary 6"}</SelectItem>
                  <SelectItem value="college_7">{t("college7") || "College 7"}</SelectItem>
                  <SelectItem value="college_8">{t("college8") || "College 8"}</SelectItem>
                  <SelectItem value="college_9">{t("college9") || "College 9"}</SelectItem>
                  <SelectItem value="tronc_commun">{t("troncCommun") || "Tronc Commun"}</SelectItem>
                  <SelectItem value="bac_1">{t("bac1") || "Bac 1"}</SelectItem>
                  <SelectItem value="bac_2">{t("bac2") || "Bac 2"}</SelectItem>
                  <SelectItem value="university">{t("university") || "University"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_private"
                checked={formData.is_private}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_private">{t("privateGroup") || "Make this group private"}</Label>
            </div>

            {formData.is_private && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <p>{t("privateGroupInfo") || "Private groups are only visible to members and require admin approval to join."}</p>
              </div>
            )}

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-600 text-sm">
                {errors.submit}
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/community/groups">
              {t("cancel") || "Cancel"}
            </Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ?
              (t("creating") || "Creating...") :
              (t("createGroup") || "Create Group")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateStudyGroupPage;
