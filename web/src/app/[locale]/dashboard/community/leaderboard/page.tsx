"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import { CommunityService } from '@/services/CommunityService';
import { CommunityWebSocketProvider } from '@/providers/CommunityWebSocketProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Medal, Trophy, Award, TrendingUp, MessageSquare, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LeaderboardPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API call when implemented
        const leaderboardMockData = [
          { id: 1, name: "Mariam Ahmed", avatar: "", points: 860, streak: 12, contributions: 24, rank: 1 },
          { id: 2, name: "Youssef Hassan", avatar: "", points: 750, streak: 9, contributions: 18, rank: 2 },
          { id: 3, name: "Noor El-Din", avatar: "", points: 720, streak: 8, contributions: 15, rank: 3 },
          { id: 4, name: "Sara Mahmoud", avatar: "", points: 650, streak: 7, contributions: 12, rank: 4 },
          { id: 5, name: "Ahmed Khaled", avatar: "", points: 610, streak: 6, contributions: 14, rank: 5 },
          { id: 6, name: "Layla Adel", avatar: "", points: 590, streak: 6, contributions: 10, rank: 6 },
          { id: 7, name: "Omar Farouk", avatar: "", points: 540, streak: 5, contributions: 9, rank: 7 },
          { id: 8, name: "Rania Ibrahim", avatar: "", points: 510, streak: 5, contributions: 11, rank: 8 },
          { id: 9, name: "Karim Nabil", avatar: "", points: 490, streak: 4, contributions: 8, rank: 9 },
          { id: 10, name: "Hala Samir", avatar: "", points: 470, streak: 4, contributions: 7, rank: 10 },
        ];

        setLeaderboardData(leaderboardMockData);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [activeTab]); // Re-fetch when tab changes

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const topThreeUsers = leaderboardData.slice(0, 3);
  const otherUsers = leaderboardData.slice(3);

  return (
    <CommunityWebSocketProvider>
      <div className={`space-y-6 max-w-8xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("leaderboard") || "Community Leaderboard"}</h1>
          <p className="text-muted-foreground text-sm">
            {t("leaderboardDescription") || "See the top contributors and most active members in our learning community"}
          </p>
        </div>

        <Tabs defaultValue="weekly" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="weekly">{t("weekly") || "This Week"}</TabsTrigger>
            <TabsTrigger value="monthly">{t("monthly") || "This Month"}</TabsTrigger>
            <TabsTrigger value="allTime">{t("allTime") || "All Time"}</TabsTrigger>
            <TabsTrigger value="subjects">{t("bySubject") || "By Subject"}</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-4 justify-center items-end mb-8">
                  {/* Second Place */}
                  {topThreeUsers[1] && (
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-silver">
                          <AvatarImage src={topThreeUsers[1].avatar} />
                          <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                            {getInitials(topThreeUsers[1].name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-silver text-white rounded-full w-8 h-8 flex items-center justify-center">
                          2
                        </div>
                      </div>
                      <h3 className="mt-5 font-medium">{topThreeUsers[1].name}</h3>
                      <p className="text-muted-foreground">{topThreeUsers[1].points} {t("points") || "points"}</p>
                    </div>
                  )}

                  {/* First Place */}
                  {topThreeUsers[0] && (
                    <div className="flex flex-col items-center">
                      <Trophy className="h-10 w-10 text-yellow-500 mb-2" />
                      <div className="relative">
                        <Avatar className="h-32 w-32 border-4 border-yellow-500">
                          <AvatarImage src={topThreeUsers[0].avatar} />
                          <AvatarFallback className="text-3xl bg-amber-100 text-amber-700">
                            {getInitials(topThreeUsers[0].name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          1
                        </div>
                      </div>
                      <h3 className="mt-5 font-semibold text-lg">{topThreeUsers[0].name}</h3>
                      <p className="text-muted-foreground">{topThreeUsers[0].points} {t("points") || "points"}</p>
                    </div>
                  )}

                  {/* Third Place */}
                  {topThreeUsers[2] && (
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-bronze">
                          <AvatarImage src={topThreeUsers[2].avatar} />
                          <AvatarFallback className="text-xl bg-orange-100 text-orange-700">
                            {getInitials(topThreeUsers[2].name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-bronze text-white rounded-full w-8 h-8 flex items-center justify-center">
                          3
                        </div>
                      </div>
                      <h3 className="mt-5 font-medium">{topThreeUsers[2].name}</h3>
                      <p className="text-muted-foreground">{topThreeUsers[2].points} {t("points") || "points"}</p>
                    </div>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("topContributors") || "Top Contributors"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{t("rank") || "Rank"}</TableHead>
                          <TableHead>{t("user") || "User"}</TableHead>
                          <TableHead className="text-right">{t("points") || "Points"}</TableHead>
                          <TableHead className="text-right">{t("streak") || "Streak"}</TableHead>
                          <TableHead className="text-right">{t("contributions") || "Contributions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {otherUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.rank}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{user.points}</TableCell>
                            <TableCell className="text-right">{user.streak} {t("days") || "days"}</TableCell>
                            <TableCell className="text-right">{user.contributions}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="monthly">
            <div className="flex justify-center py-12">
              <p>{t("loadingMonthlyData") || "Loading monthly leaderboard data..."}</p>
            </div>
          </TabsContent>

          <TabsContent value="allTime">
            <div className="flex justify-center py-12">
              <p>{t("loadingAllTimeData") || "Loading all-time leaderboard data..."}</p>
            </div>
          </TabsContent>

          <TabsContent value="subjects">
            <div className="flex justify-center py-12">
              <p>{t("loadingSubjectData") || "Loading subject-specific leaderboard data..."}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-muted/40 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium mb-3">{t("howPointsWork") || "How Points Work"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("forumActivity") || "Forum Activity"}</h4>
                <p className="text-xs text-muted-foreground">{t("forumPoints") || "Earn points by posting and replying in forums"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("groupParticipation") || "Group Participation"}</h4>
                <p className="text-xs text-muted-foreground">{t("groupPoints") || "Earn points by participating in study groups"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("consistency") || "Consistency"}</h4>
                <p className="text-xs text-muted-foreground">{t("streakPoints") || "Earn bonus points by maintaining your streak"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("helpfulness") || "Helpfulness"}</h4>
                <p className="text-xs text-muted-foreground">{t("helpfulPoints") || "Earn points when your contributions are marked as helpful"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommunityWebSocketProvider>
  );
};

export default LeaderboardPage;
