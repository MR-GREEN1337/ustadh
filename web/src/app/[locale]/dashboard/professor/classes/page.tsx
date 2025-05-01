"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { ProfessorService, ClassItem } from "@/services/ProfessorService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { User, Calendar, Search, Plus, School, Layers, Filter } from "lucide-react";
import Link from "next/link";
import { AddClassDialog } from "./_components/AddClassDialog"; // Import the AddClassDialog component

export default function ClassesPage() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear, setAcademicYear] = useState<string | null>(null);
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to trigger data refresh

  // Function to refresh data after a class is added
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const response = await ProfessorService.getTeachingClasses();
        if (response && response.classes) {
          setClasses(response.classes);
          setFilteredClasses(response.classes);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  useEffect(() => {
    // Apply filters when search term or filters change
    let result = [...classes];

    // Filter by search term
    if (searchTerm) {
      result = result.filter((cls) =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by academic year
    if (academicYear) {
      result = result.filter((cls) => cls.academicYear === academicYear);
    }

    // Filter by education level
    if (educationLevel) {
      result = result.filter((cls) => cls.educationLevel === educationLevel);
    }

    setFilteredClasses(result);
  }, [searchTerm, academicYear, educationLevel, classes]);

  // Extract unique academic years and education levels for filters
  const academicYears = [...new Set(classes.map((cls) => cls.academicYear))];
  const educationLevels = [...new Set(classes.map((cls) => cls.educationLevel))];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("myClasses")}</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {t("schedule")}
          </Button>
          <AddClassDialog
            onSuccess={refreshData} // Pass the refresh function as a prop
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">{t("allClasses")}</TabsTrigger>
          <TabsTrigger value="active">{t("activeClasses")}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("upcomingClasses")}</TabsTrigger>
        </TabsList>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchClasses")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="border rounded-md p-2"
            value={academicYear || ""}
            onChange={(e) => setAcademicYear(e.target.value || null)}
          >
            <option value="">{t("allYears")}</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            className="border rounded-md p-2"
            value={educationLevel || ""}
            onChange={(e) => setEducationLevel(e.target.value || null)}
          >
            <option value="">{t("allLevels")}</option>
            {educationLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/dashboard/professor/classes/${cls.id}`}
                  className="block"
                >
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <Badge>{cls.educationLevel}</Badge>
                      </div>
                      <CardDescription>
                        {t("academicYear")}: {cls.academicYear}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {t("students")}: {cls.studentCount}
                        </span>
                      </div>
                      {cls.roomNumber && (
                        <div className="flex items-center space-x-2 mb-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {t("room")}: {cls.roomNumber}
                          </span>
                        </div>
                      )}
                      {cls.academicTrack && (
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {t("track")}: {cls.academicTrack}
                          </span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 text-sm text-muted-foreground">
                      {cls.nextSession && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{cls.nextSession}</span>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <School className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">
                {searchTerm || academicYear || educationLevel
                  ? t("noClassesMatchFilters")
                  : t("noClassesFound")}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {searchTerm || academicYear || educationLevel
                  ? t("tryDifferentFilters")
                  : t("noClassesAssigned")}
              </p>
              {(searchTerm || academicYear || educationLevel) ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setAcademicYear(null);
                    setEducationLevel(null);
                  }}
                >
                  {t("clearFilters")}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p>{t("createYourFirstClass")}</p>
                  <AddClassDialog
                    trigger={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("createClass")}
                      </Button>
                    }
                    onSuccess={refreshData}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {/* Content for active classes - similar to "all" but with filtered classes */}
          <div className="text-center p-8 text-muted-foreground">
            {t("activeClassesDescription")}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          {/* Content for upcoming classes - similar to "all" but with filtered classes */}
          <div className="text-center p-8 text-muted-foreground">
            {t("upcomingClassesDescription")}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
