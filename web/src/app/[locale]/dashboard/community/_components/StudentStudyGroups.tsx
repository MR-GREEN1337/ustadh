// app/[locale]/dashboard/community/_components/StudentStudyGroups.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const StudentStudyGroups = ({ groups, isLoading, isRTL }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
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
        <h3 className="text-xl font-medium mb-4">Popular Study Groups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.slice(0, 4).map((group) => (
            <Card key={group.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.is_private && (
                    <div className="text-xs bg-muted px-2 py-1 rounded-full">Private</div>
                  )}
                </div>
                <CardDescription>{group.subject?.name || "General"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {group.member_count} members
                </div>
                <Button size="sm">Join Group</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">Your Study Groups</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Example personal groups - would be filtered based on user membership */}
          <Card className="border bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Math Problem Solvers</CardTitle>
              <CardDescription>Mathematics</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>3 new messages</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Session scheduled today</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="gap-1 ml-auto">
                Open <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Physics Study Club</CardTitle>
              <CardDescription>Physics</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <Users className="h-3 w-3 mr-1" />
                <span>12 members</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3 mr-1" />
                <span>5 shared resources</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="gap-1 ml-auto">
                Open <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentStudyGroups;
