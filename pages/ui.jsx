import React from "react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Progress } from "@/components/ui/progress.jsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select.jsx";
import { MapContainer, TileLayer } from "react-leaflet";

export default function UIShowcase() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">UI Showcase</h1>
        <Badge className="bg-emerald-600 text-white">Live Components</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-x-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about">About</Label>
              <Textarea id="about" rows={3} placeholder="Short bio" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Selections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="agree" />
              <Label htmlFor="agree">I agree</Label>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nyc">New York</SelectItem>
                  <SelectItem value="ldn">London</SelectItem>
                  <SelectItem value="blr">Bengaluru</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Tabs & Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="one">
              <TabsList>
                <TabsTrigger value="one">One</TabsTrigger>
                <TabsTrigger value="two">Two</TabsTrigger>
                <TabsTrigger value="three">Three</TabsTrigger>
              </TabsList>
              <TabsContent value="one" className="space-y-4">
                <p className="text-slate-600">Tab one content</p>
                <Separator />
                <Progress value={35} />
              </TabsContent>
              <TabsContent value="two" className="space-y-4">
                <p className="text-slate-600">Tab two content</p>
                <Separator />
                <Progress value={70} />
              </TabsContent>
              <TabsContent value="three" className="space-y-4">
                <p className="text-slate-600">Tab three content</p>
                <Separator />
                <Progress value={90} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle>Map (OpenStreetMap)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-hidden rounded-xl border border-slate-200">
              <MapContainer
                center={[12.9716, 77.5946]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
