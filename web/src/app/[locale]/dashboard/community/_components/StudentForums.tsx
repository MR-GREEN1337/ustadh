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
  PinIcon
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const StudentForums = ({ posts, isLoading, isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium mb-4">{t("latestDiscussions") || "Latest Discussions"}</h3>
        <div className="space-y-4">
          {posts && posts.length > 0 ? posts.map((post) => (
            <Card key={post.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {post.is_pinned && <PinIcon className="h-3 w-3 text-amber-500" />}
                    {post.title}
                  </CardTitle>
                  {post.is_pinned && (
                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      {t("pinned") || "Pinned"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.full_name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{post.author.full_name}</span>
                  <span className="text-xs text-muted-foreground mx-1">•</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2">{post.content}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.tags.map((tag, index) => (
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
          )) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("noPostsFound") || "No forum posts found. Be the first to start a discussion!"}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("discussionCategories") || "Discussion Categories"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Mathematics", "Physics", "Arabic Literature", "Study Tips"].map((category, idx) => (
            <Card key={idx} className="border cursor-pointer hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-full p-2 bg-primary/10">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t(category.toLowerCase()) || category}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 50) + 10} {t("topics") || "topics"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentForums;
