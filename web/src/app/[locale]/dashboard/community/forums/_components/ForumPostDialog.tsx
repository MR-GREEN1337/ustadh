// app/[locale]/dashboard/community/forums/ForumPostDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, PenTool } from 'lucide-react';
import { CommunityService } from '@/services/CommunityService';

interface ForumPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

const ForumPostDialog: React.FC<ForumPostDialogProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject_id: '',
    tags: [] as string[]
  });

  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [currentTag, setCurrentTag] = useState('');

  // Fetch subjects from API when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
      resetForm();
    }
  }, [isOpen]);

  const fetchSubjects = async () => {
    try {
      // In a real app, you'd fetch from your API
      const subjectsData = await CommunityService.getSubjects();
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      // Fallback to empty array
      setSubjects([]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      subject_id: '',
      tags: []
    });
    setErrors({});
    setCurrentTag('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t("titleRequired") || "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = t("contentRequired") || "Content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newPost = await CommunityService.createForumPost(formData);
      onPostCreated(newPost);
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      setErrors({
        ...errors,
        submit: t("createPostError") || "Failed to create post. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>{t("createForumPost") || "Create a Forum Post"}</DialogTitle>
          <DialogDescription>
            {t("postDetailsDesc") || "Share your question, insight, or discussion topic with the academic community"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("postTitle") || "Post Title"} *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t("postTitlePlaceholder") || "Enter a clear, specific title for your post"}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("postContent") || "Post Content"} *</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder={t("postContentPlaceholder") || "Provide details, context, and be specific in your question or discussion"}
              className={errors.content ? "border-red-500" : ""}
              rows={6}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <PenTool className="h-3 w-3" />
              <span>{t("markdownSupported") || "Markdown formatting supported"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t("subject") || "Academic Subject"}</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) => handleSelectChange('subject_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSubject") || "Select a subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      {t("loadingSubjects") || "Loading subjects..."}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">{t("tags") || "Tags"}</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("tagsPlaceholder") || "Add tags (press Enter)"}
                />
                <Button type="button" variant="outline" onClick={handleAddTag} disabled={!currentTag.trim()}>
                  {t("add") || "Add"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-600 text-sm">
              {errors.submit}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ?
              (t("posting") || "Posting...") :
              (t("createPost") || "Create Post")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForumPostDialog;
