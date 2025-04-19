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
import {
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  ArrowRight,
  Lock,
  Settings
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { CommunityService } from '@/services/CommunityService';

const TeacherStudyGroups = ({ groups, isLoading, isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();
  const [managedGroups, setManagedGroups] = useState([]);
  const [loadingJoin, setLoadingJoin] = useState(null);

  // In a real app, you'd fetch managed groups separately
  useEffect(() => {
    if (groups.length > 0) {
      // For demo purposes - pretend the teacher manages the first two groups
      setManagedGroups(groups.slice(0, 2).map(group => ({
        ...group,
        role: index === 0 ? 'admin' : 'moderator'
      })));
    }
  }, [groups]);

  const handleJoinGroup = async (groupId) => {
    setLoadingJoin(groupId);
    try {
      await CommunityService.joinStudyGroup(groupId);
      router.push(`/${locale}/dashboard/community/groups/${groupId}`);
    } catch (error) {
      console.error("Failed to join group:", error);
    } finally {
      setLoadingJoin(null);
    }
  };

  const navigateToGroup = (groupId) => {
    router.push(`/${locale}/dashboard/community/groups/${groupId}`);
  };

  const navigateToManage = (groupId) => {
    router.push(`/${locale}/dashboard/community/groups/${groupId}/manage`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
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
                  <Skeleton className="h-8 w-24" />
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
      {managedGroups.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">{t("yourManagedGroups") || "Groups You Manage"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {managedGroups.map((group) => (
              <Card key={group.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      {group.name}
                      {group.is_private && (
                        <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <Badge variant={group.role === 'admin' ? 'default' : 'secondary'}>
                      {t(group.role) || group.role}
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
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => navigateToManage(group.id)}
                  >
                    <Settings className="h-3 w-3" />
                    {t("manage") || "Manage"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => navigateToGroup(group.id)}
                  >
                    {t("open") || "Open"} <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-medium mb-4">{t("otherGroups") || "Other Academic Groups"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groups.length > 0 ?
            groups
              .filter(group => !managedGroups.some(mg => mg.id === group.id))
              .slice(0, 3)
              .map((group) => (
                <Card key={group.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        {group.name}
                        {group.is_private && (
                          <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                        )}
                      </CardTitle>
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
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                {t("noGroupsFound") || "No study groups found."}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default TeacherStudyGroups;
