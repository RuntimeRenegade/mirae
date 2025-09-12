import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Linking
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@/providers/AuthProvider'
import { ArtStyleType } from '../../types/artStyles'
import { CustomAlert, createCustomAlert } from '../ui/CustomAlert'

interface PhotoAnalysisResult {
  isAppropriate: boolean
  reason?: string
  detectedElements?: {
    peopleCount: number
    hasChild: boolean
    hasAdult: boolean
  }
}

interface CustomCharacter {
  id: string
  name: string
  description: string
}

interface MiraeOnboardingNewRNProps {
  onComplete: (bookData: any) => void
  onCancel: () => void
}

type StoryStyleType = 'dr_seuss' | 'build_your_own_adventure' | 'eric_carle' | 'maurice_sendak' | 'roald_dahl' | 'shel_silverstein' | 'the_heros_journal' | 'dear_diary' | 'comic_quest' | 'epic_adventure' | 'story_in_verse' | 'choose_your_path'

export default function MiraeOnboardingNewRN({ onComplete, onCancel }: MiraeOnboardingNewRNProps) {
  const { session } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [customCharacter, setCustomCharacter] = useState<CustomCharacter | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{
    stage: 'upload' | 'analyze' | 'save' | 'complete' | 'error'
    message: string
    analysis?: PhotoAnalysisResult
  } | null>(null)
  
  // Coming Soon modal state
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)
  
  // Character dropdown state
  const [storedCharacters, setStoredCharacters] = useState<CustomCharacter[]>([])
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false)
  const [loadingCharacters, setLoadingCharacters] = useState(false)
  
  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    config: Omit<import('../ui/CustomAlert').CustomAlertProps, 'visible'> | null;
  }>({
    visible: false,
    config: null
  })
  
  // Debug log to confirm component is rendering
  console.log('MiraeOnboardingNewRN rendering with step:', step, 'loading:', loading)
  
  const [formData, setFormData] = useState({
    child_name: '',
    child_gender: '', // 'boy', 'girl', or 'nonbinary'
    child_age: 6,
    story_setting: '',
    story_style: '' as StoryStyleType | '',
    art_style: '' as ArtStyleType | ''
  })

  // Age options for picker
  const ageOptions = [6, 7, 8, 9, 10, 11, 12]
  
  // Disabled ages that show "Coming Soon"
  const disabledAges = [9, 10, 11, 12]
  
  // Helper function to show custom alerts
  const showCustomAlert = (config: Omit<import('../ui/CustomAlert').CustomAlertProps, 'visible'>) => {
    setCustomAlert({
      visible: true,
      config
    })
  }
  
  // Helper function to close custom alerts
  const closeCustomAlert = () => {
    setCustomAlert({
      visible: false,
      config: null
    })
  }
  
  // Handle age selection with disabled age check
  const handleAgeSelection = (age: number) => {
    if (disabledAges.includes(age)) {
      setShowComingSoonModal(true)
    } else {
      setFormData({ ...formData, child_age: age })
    }
  }

  // Gender options
  const genderOptions = [
    { value: 'boy', label: 'Boy', icon: '👦' },
    { value: 'girl', label: 'Girl', icon: '👧' },
  ]

  // Load stored characters when component mounts
  const loadStoredCharacters = async () => {
    if (!session?.access_token) return

    setLoadingCharacters(true)
    try {
      console.log('Loading stored characters...')
      const response = await fetch('https://www.notgpt.net/api/mirae/characters/analyze', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const characters = data.characters || []
        setStoredCharacters(characters)
        console.log('✅ Loaded stored characters:', characters.length)
        
        // Optional: Show success feedback if this was a manual refresh
        if (loadingCharacters) {
          console.log('Character list refreshed successfully!')
        }
      } else {
        console.error('Failed to load stored characters:', response.status)
        showCustomAlert(createCustomAlert.error(
          'Error Loading Characters',
          'Unable to load your character list. Please check your connection and try again.'
        ))
      }
    } catch (error) {
      console.error('Failed to load stored characters:', error)
      showCustomAlert(createCustomAlert.error(
        'Error Loading Characters',
        'Unable to load your character list. Please check your connection and try again.'
      ))
    } finally {
      setLoadingCharacters(false)
    }
  }

  useEffect(() => {
    // Load stored characters when component mounts and user is authenticated
    if (session) {
      loadStoredCharacters()
    }
  }, [session])

  const showPhotoRequirementsAlert = () => {
    const config = createCustomAlert.photoRequirements(
      formData.child_age,
      () => {
        setCustomAlert({ visible: false, config: null });
        handleCameraPicker();
      },
      () => {
        setCustomAlert({ visible: false, config: null });
        handleImagePicker();
      }
    );
    
    setCustomAlert({ visible: true, config });
  }

  const handleCameraPicker = async () => {
    console.log('handleCameraPicker called')
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      showCustomAlert(createCustomAlert.permissionRequired('camera'))
      return
    }

    console.log('Launching camera...')
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      console.log('Photo taken:', result.assets[0].uri)
      
      // Always prompt for character name to allow different variations
      Alert.prompt(
        'Character Name',
        `What would you like to name this character?

The AI Artist will analyze many details in the photo, so you may want to save multiple versions of the same character.

We recommend naming them descriptively like:
• "Emma-GreenShirt" 
• "Liam-Birthday"
• "Sarah-Playground"

This makes it easy to find the right character, and we'll automatically use the first part of the name when you select this character for your story.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Create',
            onPress: (characterName?: string) => {
              if (!characterName || characterName.trim().length === 0) {
                showCustomAlert(createCustomAlert.nameRequired('character'))
                return
              }
              console.log('Starting analysis with name:', characterName.trim())
              analyzeAndCreateCharacter(result.assets[0], characterName.trim())
            },
          },
        ],
        'plain-text',
        formData.child_name // Pre-fill with child's name as suggestion
      )
    } else {
      console.log('Camera was canceled or no asset selected')
    }
  }

  const handleImagePicker = async () => {
    console.log('handleImagePicker called')
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      showCustomAlert(createCustomAlert.permissionRequired('photos'))
      return
    }

    console.log('Launching image picker...')
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      console.log('Image selected:', result.assets[0].uri)
      
      // Always prompt for character name to allow different variations
      Alert.prompt(
        'Character Name',
        `What would you like to name this character?

The AI Artist will analyze many details in the photo, so you may want to save multiple versions of the same character.

We recommend naming them descriptively like:
• "Emma-GreenShirt" 
• "Liam-Birthday"
• "Sarah-Playground"

This makes it easy to find the right character, and we'll automatically use the first part of the name when you select this character for your story.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Create',
            onPress: (characterName?: string) => {
              if (!characterName || characterName.trim().length === 0) {
                showCustomAlert(createCustomAlert.nameRequired('character'))
                return
              }
              console.log('Starting analysis with name:', characterName.trim())
              analyzeAndCreateCharacter(result.assets[0], characterName.trim())
            },
          },
        ],
        'plain-text',
        formData.child_name // Pre-fill with child's name as suggestion
      )
    } else {
      console.log('Image picker was canceled or no asset selected')
    }
  }

  const analyzeAndCreateCharacter = async (asset: any, name: string) => {
    if (!session?.access_token) {
      console.error('No access token available')
      showCustomAlert(createCustomAlert.authError())
      return
    }

    console.log('Starting photo analysis for:', name)
    console.log('Session access token available:', !!session.access_token)

    try {
      // Stage 1: Upload
      setUploadProgress({
        stage: 'upload',
        message: 'Uploading photo for analysis...'
      })

      // Create form data for upload
      const formData = new FormData()
      
      // For React Native, we need to handle the file differently
      formData.append('photo', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'character.jpg',
      } as any)
      formData.append('name', name)

      console.log('FormData created with asset:', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'character.jpg'
      })

      // Stage 2: Analyze
      setUploadProgress({
        stage: 'analyze',
        message: 'Analyzing photo with AI...'
      })

      const response = await fetch('https://www.notgpt.net/api/mirae/characters/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      const data = await response.json()
      console.log('Response data:', data)

      if (!data.success) {
        // Photo was rejected
        setUploadProgress({
          stage: 'error',
          message: data.message || 'Photo analysis failed',
          analysis: data.analysis
        })
        
        showCustomAlert(createCustomAlert.error(
          'Photo Not Suitable',
          data.analysis?.reason || 'The photo could not be used for character creation. Please try a different photo with one person clearly visible.',
          () => setUploadProgress(null)
        ))
        return
      }

      // Stage 3: Save (already done by API)
      setUploadProgress({
        stage: 'save',
        message: 'Saving character description...'
      })

      // Stage 4: Complete
      setUploadProgress({
        stage: 'complete',
        message: 'Character description created successfully!',
        analysis: data.analysis
      })

      // Save the character data
      setCustomCharacter(data.character)

      // 🔧 FIX: Refresh the dropdown to show the new character
      await loadStoredCharacters()

      // Clear progress after delay and show success feedback
      setTimeout(() => {
        setUploadProgress(null)
        
        // Check for AI analysis comments - only show if present
        const analysisComments = data.character?.ai_analysis?.comments || data.analysis?.ai_analysis?.comments || data.ai_analysis?.comments
        const analysisText = analysisComments ? 
          `\n\nAI Analysis:\n${analysisComments}` : ''
        
        // Show success alert with option to select the new character
        showCustomAlert({
          title: '✅ Character Created Successfully!',
          subtitle: `${data.character.name} has been successfully analyzed and added to your characters list.${analysisText}\n\nWould you like to select this character for your story?`,
          buttons: [
            { 
              text: 'Maybe Later', 
              style: 'cancel' as const
            },
            {
              text: 'Select Character',
              onPress: () => {
                closeCustomAlert()
                handleCharacterSelect(data.character)
              },
              style: 'default' as const,
              icon: 'checkmark-circle' as const
            }
          ]
        })
      }, 1500)

    } catch (error) {
      console.error('Error creating character:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
      
      setUploadProgress({
        stage: 'error',
        message: `Failed to create character: ${errorMessage}`
      })
      
      showCustomAlert(createCustomAlert.error(
        'Error',
        `Failed to create character: ${errorMessage}`,
        () => setUploadProgress(null)
      ))
    }
  }

  const handleCharacterSelect = (character: CustomCharacter) => {
    setCustomCharacter(character)
    setShowCharacterDropdown(false)
    
    // Enhanced name extraction with better regex patterns
    // Handles cases like: "Emma-GreenShirt", "Liam_Birthday", "Sarah (Playground)", "Alex123-Red", etc.
    const extractedName = character.name
      .split(/[-_\s(\d]/)[0] // Split on dash, underscore, space, parenthesis, or digit
      .replace(/[^a-zA-Z]/g, '') // Remove any remaining non-letters
      .trim()
    
    // Fallback to original name if extraction results in empty string
    const finalName = extractedName || character.name.trim()
    
    // Auto-populate the name field with the extracted name
    setFormData(prev => ({ 
      ...prev, 
      child_name: finalName 
    }))
    
    console.log('Selected character:', character.name)
    console.log('Auto-populated name field with:', finalName)
    console.log('Character description:', character.description)
    
    // Show brief success feedback
    showCustomAlert(createCustomAlert.characterSelected(character.name, finalName))
  }

  const handleCharacterDelete = async (characterId: string) => {
    if (!session?.access_token) return

    try {
      const response = await fetch(`/api/mirae/characters/${characterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        // Remove from stored characters
        setStoredCharacters(prev => prev.filter(c => c.id !== characterId))
        
        // Clear selection if this character was selected
        if (customCharacter?.id === characterId) {
          setCustomCharacter(null)
        }
        
        console.log('Character deleted successfully')
      } else {
        throw new Error('Failed to delete character')
      }
    } catch (error) {
      console.error('Failed to delete character:', error)
      showCustomAlert(createCustomAlert.error('Error', 'Failed to delete character. Please try again.'))
    }
  }

  const nextStep = () => {
    if (canProceedFromStep1()) {
      // Complete this step and return the form data (without story_setting)
      const completedData = {
        child_name: formData.child_name,
        child_gender: formData.child_gender,
        child_age: formData.child_age,
        customCharacter: customCharacter
      }
      
      console.log('Completing onboarding with data:', completedData)
      onComplete(completedData)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceedFromStep1 = () => {
    return formData.child_name.trim().length > 0 && formData.child_gender.length > 0
  }

  if (loading && step === 1) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent'
      }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={{ color: '#1f2937', marginTop: 16, fontSize: 16, fontWeight: '600' }}>Loading...</Text>
        
        {/* Custom Alert */}
        {customAlert.config && (
          <CustomAlert
            visible={customAlert.visible}
            {...customAlert.config}
            onClose={() => setCustomAlert({ visible: false, config: null })}
          />
        )}
      </View>
    )
  }

  // Step 1: Child Information
  if (step === 1) {
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
          {/* Scrollable Content */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              padding: 24,
              paddingBottom: 100 // Add space for sticky button
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: 32
            }}>
              Lets Get Started!
            </Text>

        <View style={{ gap: 24 }}>
          {/* Custom Character Dropdown */}
          <View>
            <Text style={{
              color: '#1f2937',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Choose Character
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowCharacterDropdown(!showCharacterDropdown)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: customCharacter ? 'rgba(16, 185, 129, 0.5)' : 'rgba(139, 92, 246, 0.3)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons 
                  name={customCharacter ? "person" : "person-outline"} 
                  size={20} 
                  color={customCharacter ? "rgba(16, 185, 129, 0.8)" : "rgba(139, 92, 246, 0.7)"} 
                />
                <Text style={{
                  color: customCharacter ? 'rgba(16, 185, 129, 0.9)' : '#1f2937',
                  fontSize: 16,
                  marginLeft: 8,
                  flex: 1
                }}>
                  {customCharacter ? customCharacter.name : 'Select or create a character'}
                </Text>
              </View>
              <Ionicons 
                name={showCharacterDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#1f2937" 
              />
            </TouchableOpacity>

            {/* Character Dropdown */}
            {showCharacterDropdown && (
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 12,
                marginTop: 8,
                borderWidth: 1,
                borderColor: 'rgba(139, 92, 246, 0.3)',
                maxHeight: 250,
                overflow: 'hidden'
              }}>
                {/* Dropdown Header with Refresh */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(139, 92, 246, 0.2)'
                }}>
                  <Text style={{
                    color: '#1f2937',
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    {storedCharacters.length} Characters
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('Refreshing character list...')
                      loadStoredCharacters()
                    }}
                    disabled={loadingCharacters}
                    style={{
                      padding: 4
                    }}
                  >
                    {loadingCharacters ? (
                      <ActivityIndicator size="small" color="rgba(139, 92, 246, 0.7)" />
                    ) : (
                      <Ionicons name="refresh" size={16} color="rgba(139, 92, 246, 0.7)" />
                    )}
                  </TouchableOpacity>
                </View>
                
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Create New Character Option */}
                  <TouchableOpacity
                    onPress={() => {
                      setShowCharacterDropdown(false)
                      showPhotoRequirementsAlert()
                    }}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(139, 92, 246, 0.2)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)'
                    }}
                  >
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name="add" size={20} color="rgba(16, 185, 129, 0.8)" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: '#1f2937',
                        fontSize: 16,
                        fontWeight: '600'
                      }}>
                        Create New Character
                      </Text>
                      <Text style={{
                        color: 'rgba(16, 185, 129, 0.8)',
                        fontSize: 12
                      }}>
                        Upload a photo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Loading state */}
                  {loadingCharacters && (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="rgba(139, 92, 246, 0.7)" />
                      <Text style={{
                        color: '#1f2937',
                        fontSize: 14,
                        marginTop: 8
                      }}>
                        Loading characters...
                      </Text>
                    </View>
                  )}

                  {/* Stored Characters */}
                  {!loadingCharacters && storedCharacters.length === 0 && (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Text style={{
                        color: 'rgba(31, 41, 55, 0.6)',
                        fontSize: 14,
                        textAlign: 'center'
                      }}>
                        No saved characters yet
                      </Text>
                    </View>
                  )}

                  {storedCharacters.map((character, index) => (
                    <TouchableOpacity
                      key={character.id}
                      onPress={() => handleCharacterSelect(character)}
                      style={{
                        padding: 16,
                        borderBottomWidth: index < storedCharacters.length - 1 ? 1 : 0,
                        borderBottomColor: 'rgba(139, 92, 246, 0.2)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: customCharacter?.id === character.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                      }}
                    >
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12
                      }}>
                        <Ionicons name="person" size={20} color="rgba(59, 130, 246, 0.8)" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          color: '#1f2937',
                          fontSize: 16,
                          fontWeight: '500'
                        }}>
                          {character.name}
                        </Text>
                        <Text style={{
                          color: 'rgba(31, 41, 55, 0.6)',
                          fontSize: 12
                        }} numberOfLines={1}>
                          {character.description.substring(0, 40)}...
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          showCustomAlert(createCustomAlert.deleteConfirmation(
                            character.name,
                            () => handleCharacterDelete(character.id)
                          ))
                        }}
                        style={{
                          padding: 8,
                          marginLeft: 8
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="rgba(239, 68, 68, 0.7)" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Upload Progress Modal */}
          <Modal
            visible={uploadProgress !== null}
            transparent={true}
            animationType="fade"
          >
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <View style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 24,
                alignItems: 'center',
                margin: 20,
                minWidth: 250
              }}>
                {uploadProgress && (
                  <>
                    <View style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: uploadProgress.stage === 'complete' ? 'rgba(16, 185, 129, 0.1)' :
                                      uploadProgress.stage === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                                      'rgba(139, 92, 246, 0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 16
                    }}>
                      {uploadProgress.stage === 'complete' ? (
                        <Ionicons name="checkmark-circle" size={40} color="rgba(16, 185, 129, 0.8)" />
                      ) : uploadProgress.stage === 'error' ? (
                        <Ionicons name="close-circle" size={40} color="rgba(239, 68, 68, 0.8)" />
                      ) : (
                        <ActivityIndicator size="large" color="rgba(139, 92, 246, 0.8)" />
                      )}
                    </View>
                    <Text style={{
                      color: uploadProgress.stage === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                             uploadProgress.stage === 'complete' ? 'rgba(16, 185, 129, 0.9)' : '#1f2937',
                      fontSize: 16,
                      textAlign: 'center',
                      fontWeight: '600',
                      marginBottom: 8
                    }}>
                      {uploadProgress.stage === 'upload' && '📤 Uploading Photo'}
                      {uploadProgress.stage === 'analyze' && '🤖 AI Analyzing'}
                      {uploadProgress.stage === 'save' && '💾 Creating Character'}
                      {uploadProgress.stage === 'complete' && '✅ Success!'}
                      {uploadProgress.stage === 'error' && '❌ Error'}
                    </Text>
                    <Text style={{
                      color: uploadProgress.stage === 'error' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(107, 114, 128, 0.8)',
                      fontSize: 14,
                      textAlign: 'center',
                      lineHeight: 18
                    }}>
                      {uploadProgress.message}
                    </Text>
                    
                    {/* Progress indicator */}
                    {uploadProgress.stage !== 'complete' && uploadProgress.stage !== 'error' && (
                      <View style={{
                        width: '100%',
                        height: 4,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: 2,
                        marginTop: 16,
                        overflow: 'hidden'
                      }}>
                        <View style={{
                          width: uploadProgress.stage === 'upload' ? '25%' :
                                uploadProgress.stage === 'analyze' ? '60%' :
                                uploadProgress.stage === 'save' ? '90%' : '100%',
                          height: '100%',
                          backgroundColor: 'rgba(139, 92, 246, 0.8)',
                          borderRadius: 2
                        }} />
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          </Modal>

          {/* Character Creation Info */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{
              color: 'rgba(31, 41, 55, 0.6)',
              fontSize: 12,
              textAlign: 'center',
              lineHeight: 16
            }}>
              📸 Upload a photo to create a custom character for your story{'\n'}
              🔒 <Text 
                onPress={() => Linking.openURL('https://notgpt.net/privacy')}
                style={{
                  color: 'rgba(59, 130, 246, 0.8)',
                  textDecorationLine: 'underline'
                }}
              >
                We take privacy seriously
              </Text> - images are never stored
            </Text>
          </View>

          {/* Name Input */}
          <View>
            <Text style={{
              color: '#1f2937',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8
            }}>
              What's your name? ✨
            </Text>
            <TextInput
              value={formData.child_name}
              onChangeText={(text) => setFormData({ ...formData, child_name: text })}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: 12,
                padding: 12,
                color: '#1f2937',
                fontSize: 16,
                borderWidth: 1,
                borderColor: 'rgba(139, 92, 246, 0.3)'
              }}
              placeholder="Enter your name"
              placeholderTextColor="rgba(31, 41, 55, 0.5)"
                />
              </View>

              {/* Gender Selection */}
              <View>
                <Text style={{
                  color: '#1f2937',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 12
                }}>
                  I am a... 👤
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setFormData({ ...formData, child_gender: option.value })}
                      style={{
                        flex: 1,
                        backgroundColor: formData.child_gender === option.value 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(255, 255, 255, 0.4)',
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: formData.child_gender === option.value 
                          ? 'rgba(16, 185, 129, 0.5)' 
                          : 'rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>{option.icon}</Text>
                      <Text style={{
                        color: '#1f2937',
                        fontSize: 14,
                        fontWeight: '500'
                      }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Age Selection */}
              <View>
                <Text style={{
                  color: '#1f2937',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 12
                }}>
                  How old are you? 🎂
                </Text>
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', 
                  gap: 8 
                }}>
                  {ageOptions.map((age) => {
                    const isDisabled = disabledAges.includes(age)
                    const isSelected = formData.child_age === age
                    
                    return (
                      <TouchableOpacity
                        key={age}
                        onPress={() => handleAgeSelection(age)}
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : isDisabled
                            ? 'rgba(156, 163, 175, 0.3)'  // Gray for disabled
                            : 'rgba(255, 255, 255, 0.4)',
                          borderRadius: 12,
                          padding: 12,
                          minWidth: 50,
                          alignItems: 'center',
                          borderWidth: 2,
                          borderColor: isSelected
                            ? 'rgba(16, 185, 129, 0.5)' 
                            : isDisabled
                            ? 'rgba(156, 163, 175, 0.5)'  // Gray border for disabled
                            : 'rgba(139, 92, 246, 0.3)',
                          opacity: isDisabled ? 0.6 : 1
                        }}
                      >
                        <Text style={{
                          color: isDisabled ? '#6b7280' : '#1f2937',
                          fontSize: 16,
                          fontWeight: '600'
                        }}>
                          {age}
                        </Text>
                        {isDisabled && (
                          <Text style={{
                            color: '#6b7280',
                            fontSize: 10,
                            marginTop: 2
                          }}>
                            Soon
                          </Text>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Continue Button */}
          <BlurView style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 24,
            paddingBottom: 32,
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(139, 92, 246, 0.2)',
          }}
            intensity={80}
            tint="light"
          >
            <TouchableOpacity
              onPress={nextStep}
              disabled={!canProceedFromStep1()}
              style={{
                backgroundColor: canProceedFromStep1() 
                  ? 'rgba(16, 185, 129, 0.8)' 
                  : 'rgba(139, 92, 246, 0.3)',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                shadowColor: canProceedFromStep1() ? '#10b981' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold'
              }}>
                Continue ✨
              </Text>
            </TouchableOpacity>
          </BlurView>
        </BlurView>

        {/* Custom Alert */}
        {customAlert.config && (
          <CustomAlert
            visible={customAlert.visible}
            {...customAlert.config}
            onClose={() => setCustomAlert({ visible: false, config: null })}
          />
        )}
      </View>
    )
  }

  // Placeholder for other steps - these will be handled by separate components
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      minHeight: 400 // Ensure minimum height for expansion
    }}>
      <Text style={{ color: 'white', fontSize: 18 }}>Step {step} - Component Loading...</Text>
      <TouchableOpacity
        onPress={prevStep}
        style={{
          marginTop: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          padding: 12,
          borderRadius: 8
        }}
      >
        <Text style={{ color: 'white' }}>← Back</Text>
      </TouchableOpacity>

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <BlurView
            intensity={100}
            tint="light"
            style={{
              padding: 30,
              borderRadius: 20,
              width: '100%',
              maxWidth: 350,
              alignItems: 'center'
            }}
          >
            <Ionicons 
              name="hourglass-outline" 
              size={48} 
              color="#8b5cf6" 
              style={{ marginBottom: 16 }}
            />
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: 12
            }}>
              Coming Soon! ✨
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 24
            }}>
              We're working hard to bring magical stories for ages 9-12! 
              For now, enjoy our wonderful adventures for ages 6-8.
            </Text>
            <TouchableOpacity
              onPress={() => setShowComingSoonModal(false)}
              style={{
                backgroundColor: '#8b5cf6',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Got it!
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* Custom Alert */}
      {customAlert.config && (
        <CustomAlert
          visible={customAlert.visible}
          {...customAlert.config}
          onClose={() => setCustomAlert({ visible: false, config: null })}
        />
      )}
    </View>
  )
}
