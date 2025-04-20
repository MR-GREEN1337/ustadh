// app/[locale]/dashboard/community/_components/StudentStudyGroups.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Lock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { CommunityService } from '@/services/CommunityService';

const StudentStudyGroups = ({ groups, isLoading, isRTL }: { groups: any; isLoading: any; isRTL: any }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();
  const [myGroups, setMyGroups] = useState<any>([]);
  const [loadingJoin, setLoadingJoin] = useState(null);

  // This would be fetched from a different endpoint in a real app
  useEffect(() => {
    // For demo purposes - pretend the first two groups are the user's groups
    if (groups.length > 0) {
      setMyGroups(groups.slice(0, 2));
    }
  }, [groups]);

  const handleJoinGroup = async (groupId: any) => {
    setLoadingJoin(groupId);
    try {
      await CommunityService.joinStudyGroup(groupId);
      // Optimistically update UI
      const joinedGroup = groups.find((g: any) => g.id === groupId);
      if (joinedGroup) {
        setMyGroups([...myGroups , joinedGroup]);
      }
    } catch (error) {
      console.error("Failed to join group:", error);
    } finally {
      setLoadingJoin(null);
    }
  };

  const navigateToGroup = (groupId: any) => {
    router.push(`/${locale}/dashboard/community/groups/${groupId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myGroups.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">{t("yourGroups") || "Your Study Groups"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myGroups.map((group: any) => (
              <Card key={group.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      {group.name}
                      {group.is_private && (
                        <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <Badge variant={group.is_private ? "outline" : "secondary"}>
                      {group.is_private ? t("private") : t("public")}
                    </Badge>
                  </div>
                  <CardDescription>{group.subject?.name || t("general")}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{group.member_count} {t("members")}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 ml-auto"
                    onClick={() => navigateToGroup(group.id)}
                  >
                    {t("open")} <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-medium mb-4">{t("popularGroups") || "Popular Study Groups"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.length > 0 ?
            groups
              .filter((group: any) => !myGroups.some((myGroup: any) => myGroup.id === group.id))
              .slice(0, 4)
              .map((group: any) => (
                <Card key={group.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        {group.name}
                        {group.is_private && (
                          <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                        )}
                      </CardTitle>
                      {group.is_private && (
                        <Badge variant="outline">{t("private")}</Badge>
                      )}
                    </div>
                    <CardDescription>{group.subject?.name || t("general")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {group.member_count} {t("members")}
                    </div>
                    <Button
                      size="sm"
                      disabled={loadingJoin === group.id}
                      onClick={() => handleJoinGroup(group.id)}
                    >
                      {loadingJoin === group.id ?
                        t("joining") :
                        t("joinGroup")}
                    </Button>
                  </CardFooter>
                </Card>
              )) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                {t("noGroupsFound") || "No study groups found."}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default StudentStudyGroups;
