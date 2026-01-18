import { useEffect, useState } from "react";
import { holidaysApi, Holiday } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Search, Star } from "lucide-react";

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const data = await holidaysApi.getAll();
        
        // Filter to only show upcoming holidays
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingHolidays = data.filter((h: Holiday) => {
          const holidayDate = new Date(h.date_ad);
          return holidayDate >= today;
        });
        
        setHolidays(upcomingHolidays);
        setFilteredHolidays(upcomingHolidays);
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  useEffect(() => {
    const filtered = holidays.filter((holiday) =>
      holiday.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredHolidays(filtered);
  }, [search, holidays]);

  const publicHolidays = filteredHolidays.filter((h) => h.is_public);
  const otherHolidays = filteredHolidays.filter((h) => !h.is_public);

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg gradient-accent flex items-center justify-center">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground" />
            </div>
            Upcoming Holidays
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            आगामी नेपाली बिदाहरू
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search holidays..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 md:h-11"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 md:h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Public Holidays */}
          {publicHolidays.length > 0 && (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="gradient-primary p-3 md:p-4">
                <CardTitle className="text-primary-foreground flex items-center gap-2 text-sm md:text-base">
                  <Star className="w-4 h-4 md:w-5 md:h-5" />
                  Public Holidays ({publicHolidays.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {publicHolidays.map((holiday, index) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors animate-slide-in-left"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm md:text-base truncate">{holiday.name}</p>
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                          <span className="text-xs md:text-sm text-muted-foreground">
                            BS: {holiday.date_bs}
                          </span>
                          <span className="text-muted-foreground hidden md:inline">•</span>
                          <span className="text-xs md:text-sm text-muted-foreground">
                            AD: {holiday.date_ad}
                          </span>
                        </div>
                      </div>
                      <Badge className="gradient-accent text-secondary-foreground text-xs ml-2 shrink-0">
                        Public
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Holidays */}
          {otherHolidays.length > 0 && (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Other Holidays ({otherHolidays.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {otherHolidays.map((holiday, index) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors animate-slide-in-left"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate">{holiday.name}</p>
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                          <span className="text-xs md:text-sm text-muted-foreground">
                            BS: {holiday.date_bs}
                          </span>
                          <span className="text-muted-foreground hidden md:inline">•</span>
                          <span className="text-xs md:text-sm text-muted-foreground">
                            AD: {holiday.date_ad}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredHolidays.length === 0 && (
            <Card className="glass-card">
              <CardContent className="p-8 md:p-12 text-center">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">No upcoming holidays found</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
