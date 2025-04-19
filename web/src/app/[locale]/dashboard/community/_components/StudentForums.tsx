// app/[locale]/dashboard/community/_components/StudentForums.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Eye,
  ThumbsUp,
  Clock,
  Tag,
  PinIcon,
  BookOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  LightbulbIcon
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { ForumPost } from '@/services/CommunityService';

interface StudentForumsProps {
  posts: ForumPost[];
  isLoading: boolean;
  isRTL: boolean;
}

const StudentForums: React.FC<StudentForumsProps> = ({ posts, isLoading, isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  const getPostIcon = (post: ForumPost) => {
    // Determine icon based on post characteristics
    if (post.is_answered) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (post.title.includes('?')) return <AlertCircle className="h-5 w-5 text-amber-500" />;
    if (post.tags?.includes('resource')) return <BookOpen className="h-5 w-5 text-blue-500" />;
    if (post.tags?.includes('insight')) return <LightbulbIcon className="h-5 w-5 text-purple-500" />;
    return <MessageSquare className="h-5 w-5 text-primary" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      // Today - show hours
      return t("today") || "Today";
    } else if (diffDays === 1) {
      return t("yesterday") || "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} ${t("daysAgo") || "days ago"}`;
    } else {
      return date.toLocaleDateString(locale as string, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{t("noPostsFound") || "No forum posts found"}</h3>
        <p className="text-muted-foreground mt-2 mb-6">
          {t("beFirstToPost") || "Be the first to start an academic discussion"}
        </p>
      </div>
    );
  }

  // Filter pinned posts
  const pinnedPosts = posts.filter(post => post.is_pinned);
  const regularPosts = posts.filter(post => !post.is_pinned);

  return (
    <div className="space-y-6">
      {pinnedPosts.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">{t("pinnedPosts") || "Pinned Academic Resources"}</h3>
          <div className="space-y-4">
            {pinnedPosts.map((post) => (
              <Card
                key={post.id}
                className="border border-primary/20 bg-primary/5 hover:border-primary/30 hover:bg-primary/10 transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PinIcon className="h-4 w-4 text-primary" />
                      {post.title}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {t("pinned") || "Academic Resource"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{getInitials(post.author.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{post.author.full_name}</span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.tags && post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-muted/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.view_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {post.upvote_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.reply_count}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/${locale}/dashboard/community/forums/${post.id}`)}
                  >
                    {t("readMore") || "Read More"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-medium mb-4">{t("academicDiscussions") || "Academic Discussions"}</h3>
        <div className="space-y-4">
          {regularPosts.map((post) => (
            <Card key={post.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getPostIcon(post)}
                    {post.title}
                  </CardTitle>

                  {post.is_answered && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                      {t("answered") || "Answered"}
                    </Badge>
                  )}

                  {post.subject && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      {post.subject}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{getInitials(post.author.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{post.author.full_name}</span>
                  <span className="text-xs text-muted-foreground mx-1">•</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2">{post.content}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.tags && post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-muted/50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.view_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {post.upvote_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.reply_count}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/${locale}/dashboard/community/forums/${post.id}`)}
                >
                  {post.title.includes('?') ?
                    (t("answerQuestion") || "Answer Question") :
                    (t("joinDiscussion") || "Join Discussion")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentForums;
