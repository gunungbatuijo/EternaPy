import { useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertUserProfile, UserProfileInputExperienceLevel } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useUser } from "@clerk/react";

const onboardingSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  displayName: z.string().min(2).max(50),
  bio: z.string().max(160).optional(),
  country: z.string().max(50).optional(),
  experienceLevel: z.nativeEnum(UserProfileInputExperienceLevel),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { mutate: upsertProfile, isPending } = useUpsertUserProfile({
    mutation: {
      onSuccess: () => {
        toast.success("Profile setup complete!");
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to save profile. Please try again.");
      }
    }
  });

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: user?.username || "",
      displayName: user?.fullName || "",
      bio: "",
      country: "",
      experienceLevel: UserProfileInputExperienceLevel.beginner,
    },
  });

  function onSubmit(data: OnboardingFormValues) {
    upsertProfile({
      data: {
        ...data,
        avatarUrl: user?.imageUrl,
      }
    });
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome to EternaPy</CardTitle>
            <CardDescription>Let's set up your developer profile before you start learning.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormDescription>Your unique public handle.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormDescription>How others will see you on leaderboards.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UserProfileInputExperienceLevel.beginner}>Beginner (New to programming)</SelectItem>
                          <SelectItem value={UserProfileInputExperienceLevel.intermediate}>Intermediate (Know some basics)</SelectItem>
                          <SelectItem value={UserProfileInputExperienceLevel.advanced}>Advanced (Professional developer)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>This helps us recommend the right courses for you.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us a bit about your programming journey..." 
                          className="resize-none h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Saving..." : "Complete Setup"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
