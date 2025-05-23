
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AccountTab() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">C</AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Change Avatar
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="example@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Storage Usage</Label>
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-[15%] bg-primary"></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Using 150MB of 1GB (15%)
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" className="text-destructive hover:text-destructive">
          Sign Out
        </Button>
        
        <Button>
          Save Changes
        </Button>
      </div>
    </>
  );
}
