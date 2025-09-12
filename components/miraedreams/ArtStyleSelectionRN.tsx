import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { ArtStyleType, getArtStyleOptions, ArtStyleOption } from '../../types/artStyles'

interface ArtStyleSelectionRNProps {
  onSelect: (artStyle: ArtStyleType) => void
  onBack: () => void
  selectedArtStyle?: ArtStyleType
}

export default function ArtStyleSelectionRN({ onSelect, onBack, selectedArtStyle }: ArtStyleSelectionRNProps) {
  const [hoveredStyle, setHoveredStyle] = useState<ArtStyleType | null>(null)
  
  // Get all styles from all categories
  const allCategories = getArtStyleOptions()
  const allStyles: ArtStyleOption[] = allCategories.flatMap(category => category.styles)
  
  // Prioritize specific styles at the top
  const priorityStyles: ArtStyleType[] = ['pixel_art', 'voxel_art', 'dropship_guardians']
  const prioritizedStyles = [
    ...priorityStyles.map(styleId => allStyles.find(style => style.id === styleId)).filter(Boolean) as ArtStyleOption[],
    ...allStyles.filter(style => !priorityStyles.includes(style.id))
  ]

  const handleStyleSelect = (styleId: ArtStyleType) => {
    onSelect(styleId)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'digital': return 'rgba(59, 130, 246, 0.3)' // Blue
      case 'traditional': return 'rgba(34, 197, 94, 0.3)' // Green
      case 'fantasy': return 'rgba(168, 85, 247, 0.3)' // Purple
      case 'modern': return 'rgba(249, 115, 22, 0.3)' // Orange
      default: return 'rgba(156, 163, 175, 0.3)' // Gray
    }
  }

  const getLocalImageSource = (styleId: ArtStyleType) => {
    const imageMap = {
      'pixel_art': require('../../assets/images/art-styles/pixel.png'),
      'voxel_art': require('../../assets/images/art-styles/voxel.png'),
      'dropship_guardians': require('../../assets/images/art-styles/dropshipguardian.png'),
      'watercolor_gentle': require('../../assets/images/art-styles/watercolor.png'),
      'bright_cartoon': require('../../assets/images/art-styles/brightcartoon.png'),
      'modern_adventure_style': require('../../assets/images/art-styles/modernadventure.png'),
      'dr_seuss_style': require('../../assets/images/art-styles/whimsicalwonder.png'),
      'roald_dahl_style': require('../../assets/images/art-styles/quirkysketches.png'),
      'maurice_sendak_style': require('../../assets/images/art-styles/atmospherictales.png'),
      'shel_silverstein_style': require('../../assets/images/art-styles/simplelines.png'),
      'eric_carle_style': require('../../assets/images/art-styles/collagecreations.png'),
    }
    return imageMap[styleId] || null
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
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
        }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: 8,
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4
          }}>
            Choose Your Art Style
          </Text>
          <Text style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 24,
            textShadowColor: 'rgba(0, 0, 0, 0.7)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3
          }}>
            Select the visual style that will bring your story to life
          </Text>
        </View>

        {/* Art Style Grid */}
        <View style={{
          gap: 16
        }}>
          {prioritizedStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              onPress={() => handleStyleSelect(style.id)}
              onPressIn={() => setHoveredStyle(style.id)}
              onPressOut={() => setHoveredStyle(null)}
              style={{
                width: '100%',
                backgroundColor: selectedArtStyle === style.id 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : hoveredStyle === style.id
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: 16,
                borderWidth: 2,
                borderColor: selectedArtStyle === style.id 
                  ? 'rgba(255, 215, 0, 0.5)' 
                  : 'rgba(255, 255, 255, 0.2)',
                transform: [{ 
                  scale: selectedArtStyle === style.id ? 1.02 : hoveredStyle === style.id ? 1.01 : 1 
                }],
                shadowColor: selectedArtStyle === style.id ? '#FFD700' : 'transparent',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: selectedArtStyle === style.id ? 8 : 0
              }}
            >
              {/* Selected Indicator */}
              {selectedArtStyle === style.id && (
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 32,
                  height: 32,
                  backgroundColor: '#FFD700',
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1
                }}>
                  <Ionicons name="checkmark" size={18} color="#1a1a1a" />
                </View>
              )}

              {/* Art Style Image */}
              <View style={{
                width: '100%',
                height: 160,
                borderRadius: 12,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                marginBottom: 16,
                overflow: 'hidden',
                position: 'relative'
              }}>
                {getLocalImageSource(style.id) && (
                  <Image 
                    source={getLocalImageSource(style.id)}
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover'
                    }}
                  />
                )}
                
                {/* Fallback gradient background */}
                {!getLocalImageSource(style.id) && (
                  <View style={{
                    flex: 1,
                    backgroundColor: getCategoryColor(style.category),
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="image" size={32} color="rgba(255, 255, 255, 0.6)" />
                  </View>
                )}

                {/* Category badge */}
                <View style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: getCategoryColor(style.category),
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2
                  }}>
                    {style.category}
                  </Text>
                </View>
              </View>

              {/* Style Info */}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: 4,
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3
                  }}>
                    {style.name}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 18,
                    textShadowColor: 'rgba(0, 0, 0, 0.7)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3
                  }}>
                    {style.description}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontStyle: 'italic',
                    marginTop: 4,
                    textShadowColor: 'rgba(0, 0, 0, 0.7)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2
                  }}>
                    Inspired by {style.inspiredBy}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        </ScrollView>
        
        {/* Navigation */}
        <View style={{
          padding: 24,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16
          }}>
            <TouchableOpacity
              onPress={onBack}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 16,
                flex: 1,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="chevron-back" size={20} color="white" />
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 4,
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3
                }}>
                  Back
                </Text>
              </View>
            </TouchableOpacity>

            {selectedArtStyle && (
              <TouchableOpacity
                onPress={() => onSelect(selectedArtStyle)}
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.8)',
                  borderRadius: 12,
                  padding: 16,
                  flex: 2,
                  alignItems: 'center',
                  shadowColor: '#a855f7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginRight: 8,
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3
                  }}>
                    Continue
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </View>
  )
}
