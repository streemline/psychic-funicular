import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type ProfileProps = {
  path?: string;
};

// Define validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  monthlyGoalHours: z.string().min(1, "Monthly goal hours is required"),
  initials: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = ({ path }: ProfileProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    staleTime: 300000 // 5 minutes
  });
  
  // Initialize form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      hourlyRate: user?.hourlyRate?.toString() || "25",
      monthlyGoalHours: user?.monthlyGoalHours?.toString() || "160",
      initials: user?.initials || "",
    },
  });
  
  // Update form values when user data is fetched
  useState(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        hourlyRate: user.hourlyRate?.toString(),
        monthlyGoalHours: user.monthlyGoalHours?.toString(),
        initials: user.initials,
      });
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const response = await apiRequest("PATCH", "/api/user", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not update profile: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  // Generate initials from name
  const generateInitials = () => {
    const name = form.watch("name");
    if (!name) return "";
    
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };
  
  // Set initials based on name
  const setInitials = () => {
    const initials = generateInitials();
    form.setValue("initials", initials);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-heading text-xl font-semibold text-gray-900">Profile Settings</h2>
          <p className="text-sm text-gray-500">Manage your account profile and time tracking preferences</p>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center py-12 text-gray-500">
            Loading profile information...
          </div>
        ) : (
          <div className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Profile Information Section */}
              <section className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar/Initials */}
                  <div className="mb-4 md:mb-0 flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-3xl font-medium mb-2">
                      {form.watch("initials") || (user?.initials || "AD")}
                    </div>
                    
                    {isEditing && (
                      <button 
                        type="button" 
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        onClick={setInitials}
                      >
                        Generate Initials
                      </button>
                    )}
                  </div>
                  
                  {/* Form fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Full Name</label>
                        <input 
                          type="text" 
                          id="name"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Your full name"
                          disabled={!isEditing}
                          {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email Address</label>
                        <input 
                          type="email" 
                          id="email"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Your email address"
                          disabled={!isEditing}
                          {...form.register("email")}
                        />
                        {form.formState.errors.email &&(
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="initials">Initials</label>
                      <input 
                        type="text" 
                        id="initials"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Your initials (2 characters)"
                        disabled={!isEditing}
                        maxLength={2}
                        {...form.register("initials")}
                      />
                      <p className="mt-1 text-xs text-gray-500">These will be displayed in your profile avatar</p>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Time Tracking Settings */}
              <section className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Time Tracking Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="hourlyRate">Default Hourly Rate ($)</label>
                    <input 
                      type="number" 
                      id="hourlyRate"
                      min="0" 
                      step="0.01"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your default hourly rate"
                      disabled={!isEditing}
                      {...form.register("hourlyRate")}
                    />
                    {form.formState.errors.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.hourlyRate.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">This will be used as default when adding new time entries</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="monthlyGoalHours">Monthly Goal Hours</label>
                    <input 
                      type="number" 
                      id="monthlyGoalHours"
                      min="0" 
                      step="0.01"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your target hours per month"
                      disabled={!isEditing}
                      {...form.register("monthlyGoalHours")}
                    />
                    {form.formState.errors.monthlyGoalHours && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.monthlyGoalHours.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">This will be used to calculate your monthly progress</p>
                  </div>
                </div>
              </section>
              
              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-5 flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <button 
                      type="button" 
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset({
                          name: user?.name,
                          email: user?.email,
                          hourlyRate: user?.hourlyRate?.toString(),
                          monthlyGoalHours: user?.monthlyGoalHours?.toString(),
                          initials: user?.initials,
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile;
