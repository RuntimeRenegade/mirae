import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { useAuth } from '@/providers/AuthProvider'

interface StoryElement {
  id: string
  name: string
  display_name: string
  description: string
  preview_image_url: string
  category: string
}

interface StorySettingSelectionProps {
  onSelect: (setting: string) => void
  onBack: () => void
  selectedSetting?: string
  childAge: number
}

export default function StorySettingSelectionRN({
  onSelect,
  onBack,
  selectedSetting,
  childAge
}: StorySettingSelectionProps) {
  const { session } = useAuth()
  const [storySettings, setStorySettings] = useState<StoryElement[]>([])
  const [loadingStorySettings, setLoadingStorySettings] = useState(false)

  // Load story settings from database
  const loadStorySettings = async () => {
    if (!session?.access_token) {
      console.log('No session found, skipping story settings loading')
      return
    }

    setLoadingStorySettings(true)
    try {
      // Determine age group based on child age
      const ageGroup = childAge >= 9 ? '9-12' : '6-8'
      
      console.log('Loading story settings for age:', childAge, 'age group:', ageGroup)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
      
      // Fetch story settings from your API
      const response = await fetch(
        `https://www.notgpt.net/api/mirae/elements?age_group=${ageGroup}&type=setting`,
        {
          method: 'GET',
          headers,
        }
      )
      
      if (!response.ok) {
        console.error(`API error ${response.status}: ${response.statusText}`)
        if (response.status === 401) {
          console.error('Authentication failed for story settings API')
          Alert.alert('Authentication Error', 'Please sign in to access story settings.')
          return
        }
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Loaded story settings successfully:', data)
      
      // Based on the API code, when type=setting is specified, it returns { elements: [...], age_group: "...", type: "setting" }
      setStorySettings(data.elements || [])
      
    } catch (error) {
      console.error('Error loading story settings:', error)
      Alert.alert(
        'Error Loading Story Settings', 
        'There was a problem loading story settings. Please check your connection and try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setLoadingStorySettings(false)
    }
  }

  useEffect(() => {
    // Load story settings when component mounts and user is authenticated
    if (session && childAge > 0) {
      loadStorySettings()
    }
  }, [session, childAge])

  const handleSettingSelect = (setting: StoryElement) => {
    console.log('Selected story setting:', setting.name)
    onSelect(setting.name)
  }

  return (
    <View style={{ flex: 1, padding: 16, minHeight: 600 }}>
      <BlurView
        intensity={80}
        tint="light"
        style={{
          flex: 1,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          minHeight: 500
        }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: 24,
            flexGrow: 1,
            justifyContent: 'center'
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#1f2937',
            textAlign: 'center',
            marginBottom: 8
          }}>
            Choose Your Adventure! 🏰
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 32
          }}>
            Where would you like your story to take place?
          </Text>

          {/* Story Settings Grid */}
          <View style={{ 
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {loadingStorySettings ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={{ color: '#6b7280', marginTop: 12, fontSize: 16 }}>
                  Loading story settings...
                </Text>
              </View>
            ) : storySettings.length > 0 ? (
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                gap: 16,
                justifyContent: 'center',
                maxWidth: '100%',
                marginBottom: 32
              }}>
                {storySettings.map((setting) => (
                  <TouchableOpacity
                    key={setting.id}
                    onPress={() => handleSettingSelect(setting)}
                    style={{
                      backgroundColor: selectedSetting === setting.name 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(255, 255, 255, 0.4)',
                      borderRadius: 16,
                      padding: 20,
                      width: 180,
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: selectedSetting === setting.name 
                        ? 'rgba(16, 185, 129, 0.5)' 
                        : 'rgba(139, 92, 246, 0.3)',
                      minHeight: 160,
                      justifyContent: 'center'
                    }}
                  >
                    <View style={{ alignItems: 'center', marginBottom: 12 }}>
                      {setting.preview_image_url && setting.preview_image_url.trim() !== '' ? (
                        <Image
                          source={{ uri: setting.preview_image_url.trim() }}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                          }}
                          contentFit="cover"
                          transition={200}
                          onError={(error) => {
                            console.log('Failed to load image:', setting.preview_image_url, error)
                          }}
                          onLoad={() => {
                            console.log('Successfully loaded image:', setting.preview_image_url)
                          }}
                        />
                      ) : (
                        <Text style={{ fontSize: 48 }}>🏰</Text>
                      )}
                    </View>
                    <Text style={{
                      color: '#1f2937',
                      fontSize: 14,
                      fontWeight: '600',
                      textAlign: 'center',
                      lineHeight: 18
                    }}>
                      {setting.display_name || setting.name}
                    </Text>
                    {setting.description && (
                      <Text style={{
                        color: '#6b7280',
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 4,
                        lineHeight: 14
                      }}>
                        {setting.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <Text style={{ color: '#6b7280', fontSize: 16, textAlign: 'center' }}>
                  No story settings available.{'\n'}Please check your connection and try again.
                </Text>
              </View>
            )}

            {/* Navigation Buttons */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              marginTop: 'auto',
              gap: 16,
              width: '100%'
            }}>
              <TouchableOpacity
                onPress={onBack}
                style={{
                  backgroundColor: 'rgba(107, 114, 128, 0.6)',
                  borderRadius: 12,
                  padding: 16,
                  flex: 1,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  ← Back
                </Text>
              </TouchableOpacity>

              {selectedSetting && (
                <TouchableOpacity
                  onPress={() => onSelect(selectedSetting)}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 12,
                    padding: 16,
                    flex: 1,
                    alignItems: 'center',
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}>
                    Continue ✨
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </BlurView>
    </View>
  )
}
