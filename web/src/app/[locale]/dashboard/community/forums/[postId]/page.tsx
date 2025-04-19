// app/[locale]/dashboard/community/forums/[postId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { CommunityService, ForumPost, ForumReply } from '@/services/CommunityService';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import {
    MessageSquare,
    ThumbsUp,
    Share,
    Flag,
    Clock,
    Calendar,
    Eye,
    BookOpen,
    Bookmark,
    BookmarkCheck,
    PenTool,
    Edit,
    Trash2,
    Check
  } from 'lucide-react';

  const ForumPostPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { locale, postId } = useParams();
    const { user } = useAuth();
    const isRTL = locale === "ar";

    const [post, setPost] = useState<ForumPost | null>(null);
    const [replies, setReplies] = useState<ForumReply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [upvoted, setUpvoted] = useState(false);

    useEffect(() => {
      fetchPostDetails();
    }, [postId]);

    const fetchPostDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch the post details
        const postData = await CommunityService.getForumPost(Number(postId));
        setPost(postData);

        // Fetch post replies
        const repliesData = await CommunityService.getForumReplies(Number(postId));
        setReplies(repliesData);

        // In a real app you'd check if the post is bookmarked by the user
        // This would be an API call to check if this post is in user's bookmarks
        // For now we'll simulate this
        setIsBookmarked(false);

        // Also check if user has upvoted this post
        setUpvoted(false);
      } catch (error) {
        console.error("Failed to fetch post details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSubmitReply = async () => {
      if (!replyContent.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        // Submit the reply to API
        const newReply = await CommunityService.createForumReply(Number(postId), replyContent);

        // Update the replies list with the new reply
        setReplies([...replies, newReply]);
        setReplyContent('');

        // Refresh post to get updated reply count
        fetchPostDetails();
      } catch (error) {
        console.error("Failed to post reply:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const toggleBookmark = async () => {
      try {
        // In a real implementation, you'd call your API
        // await CommunityService.toggleBookmark(Number(postId));

        // For now, just toggle the state
        setIsBookmarked(!isBookmarked);
      } catch (error) {
        console.error("Failed to toggle bookmark:", error);
      }
    };

    const toggleUpvote = async () => {
      try {
        if (!upvoted) {
          await CommunityService.upvoteForumPost(Number(postId));
        } else {
          // In a real app, you might have a separate endpoint to remove upvote
          // await CommunityService.removeUpvoteForumPost(Number(postId));
        }

        // Toggle upvote state
        setUpvoted(!upvoted);

        // Update the post's upvote count optimistically
        if (post) {
          setPost({
            ...post,
            upvote_count: upvoted ? post.upvote_count - 1 : post.upvote_count + 1
          });
        }
      } catch (error) {
        console.error("Failed to toggle upvote:", error);
      }
    };

    const upvoteReply = async (replyId: number) => {
      try {
        await CommunityService.upvoteForumReply(replyId);

        // Update the reply in the UI
        const updatedReplies = replies.map(reply => {
          if (reply.id === replyId) {
            return {
              ...reply,
              upvote_count: reply.upvote_count + 1
            };
          }
          return reply;
        });

        setReplies(updatedReplies);
      } catch (error) {
        console.error("Failed to upvote reply:", error);
      }
    };

    const markAsBestAnswer = async (replyId: number) => {
      try {
        await CommunityService.markAsBestAnswer(Number(postId), replyId);

        // Update the replies array
        const updatedReplies = replies.map(reply => ({
          ...reply,
          is_best_answer: reply.id === replyId
        }));

        setReplies(updatedReplies);

        // Update post to show it's answered
        if (post) {
          setPost({
            ...post,
            is_answered: true
          });
        }
      } catch (error) {
        console.error("Failed to mark as best answer:", error);
      }
    };

    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!post) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">{t("postNotFound") || "Forum post not found"}</h2>
          <p className="mt-2 text-muted-foreground">{t("postNotFoundDesc") || "The post you're looking for doesn't exist or you don't have access to it."}</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/community/forums">
              {t("backToForums") || "Back to Forums"}
            </Link>
          </Button>
        </div>
      );
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale as string, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getInitials = (name: string) => {
      if (!name) return '';
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase();
    };

    return (
      <div className={`max-w-4xl mx-auto space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/dashboard">
                {t("dashboard") || "Dashboard"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/dashboard/community">
                {t("community") || "Community"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/dashboard/community/forums">
                {t("forums") || "Forums"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                {post.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {post.is_pinned && (
                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      {t("pinned") || "Pinned"}
                    </Badge>
                  )}
                  {post.subject && (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {post.subject}
                    </Badge>
                  )}
                  {post.is_answered && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                      {t("answered") || "Answered"}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-2xl font-bold">{post.title}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={toggleBookmark} title={isBookmarked ? t("removeBookmark") : t("addBookmark")}>
                  {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
                <UserConditionalComponent
                  teacher={
                    <Button variant="ghost" size="icon" title={t("editPost")}>
                      <Edit className="h-5 w-5" />
                    </Button>
                  }
                  admin={
                    <Button variant="ghost" size="icon" title={t("editPost")}>
                      <Edit className="h-5 w-5" />
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Avatar>
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>{getInitials(post.author.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.author.full_name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="prose dark:prose-invert prose-headings:font-heading max-w-none">
            <div className="space-y-4">
              <p>{post.content}</p>

              <div className="flex flex-wrap gap-1 mt-6">
                {post.tags && post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-muted/50">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="w-full flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-muted-foreground"
                  onClick={toggleUpvote}
                >
                  <ThumbsUp className={`h-4 w-4 ${upvoted ? 'text-primary fill-primary' : ''}`} />
                  <span>{post.upvote_count + (upvoted ? 1 : 0)}</span>
                </Button>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{replies.length}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Share className="h-4 w-4" />
                  {t("share") || "Share"}
                </Button>

                <Button variant="outline" size="sm" className="gap-1">
                  <Flag className="h-4 w-4" />
                  {t("report") || "Report"}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">{t("responses") || "Responses"} ({replies.length})</h3>
          </div>

          {replies.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {t("noResponsesYet") || "No responses yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("beFirstToRespond") || "Be the first to respond to this discussion"}
                </p>
              </CardContent>
            </Card>
          ) : (
            replies.map((reply) => (
              <Card key={reply.id} className={`border ${reply.is_best_answer ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/50' : ''}`}>
                {reply.is_best_answer && (
                  <div className="bg-green-500 text-white px-3 py-1 text-xs font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {t("bestAnswer") || "Best Answer"}
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={reply.author.avatar} />
                        <AvatarFallback>{getInitials(reply.author.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{reply.author.full_name}</p>
                          {reply.author.role === 'teacher' && (
                            <Badge variant="outline" className="text-xs py-0">
                              {t("teacher") || "Teacher"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(reply.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <UserConditionalComponent
                      teacher={
                        <div className="flex gap-1">
                          {!reply.is_best_answer && post.is_answered === false && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => markAsBestAnswer(reply.id)}
                            >
                              <Check className="h-3 w-3" />
                              {t("markAsBest") || "Mark as Best"}
                            </Button>
                          )}
                          {reply.author.id === user?.id && (
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      }
                      admin={
                        <div className="flex gap-1">
                          {!reply.is_best_answer && post.is_answered === false && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => markAsBestAnswer(reply.id)}
                            >
                              <Check className="h-3 w-3" />
                              {t("markAsBest") || "Mark as Best"}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      }
                    />
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm">{reply.content}</p>
                </CardContent>

                <CardFooter>
                  <div className="w-full flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-muted-foreground"
                        onClick={() => upvoteReply(reply.id)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{reply.upvote_count}</span>
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {t("reply") || "Reply"}
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("yourResponse") || "Your Response"}</CardTitle>
              <CardDescription>
                {t("shareYourThoughts") || "Share your thoughts or answer to help others"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t("writeResponsePlaceholder") || "Write your response here..."}
                className="min-h-[150px]"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                <PenTool className="h-4 w-4 inline-block mr-1" />
                {t("markdownSupported") || "Markdown supported"}
              </div>
              <Button onClick={handleSubmitReply} disabled={!replyContent.trim() || isSubmitting}>
                {isSubmitting ? t("submitting") : t("postResponse") || "Post Response"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  };

  export default ForumPostPage;
