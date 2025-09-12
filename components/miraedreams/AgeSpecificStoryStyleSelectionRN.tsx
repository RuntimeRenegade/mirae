import {
  View,
  Text,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'

type StoryStyleType = 'dr_seuss' | 'build_your_own_adventure' | 'eric_carle' | 'maurice_sendak' | 'roald_dahl' | 'shel_silverstein' | 'the_heros_journal' | 'dear_diary' | 'comic_quest' | 'epic_adventure' | 'story_in_verse' | 'choose_your_path'

interface StoryStyle {
  id: StoryStyleType
  name: string
  description: string
  characteristics: string[]
  previewText: string
  ageGroup: '6-8' | '9-12'
  icon: string
}

interface AgeSpecificStoryStyleSelectionRNProps {
  onStyleSelect: (styleType: StoryStyleType) => void
  onBack: () => void
  childAge: number
}

const getStoryStylesForAge = (childAge: number): StoryStyle[] => {
  const isOlderChild = childAge >= 9 && childAge <= 12
  
  if (isOlderChild) {
    return [
      {
        id: 'the_heros_journal',
        name: 'The Hero\'s Journal',
        description: 'Write your story as diary entries of a brave hero on an epic quest',
        characteristics: ['First person', 'Adventure', 'Personal growth'],
        previewText: 'Day 1: Today I discovered a mysterious map in the old library. The parchment felt warm in my hands...',
        ageGroup: '9-12',
        icon: ''
      },
      {
        id: 'comic_quest',
        name: 'Comic Quest',
        description: 'Action-packed adventures with dynamic storytelling like your favorite comics',
        characteristics: ['Dynamic action', 'Heroic deeds', 'Exciting plot twists'],
        previewText: 'CRASH! The door burst open as our hero leaped through, cape flowing behind...',
        ageGroup: '9-12',
        icon: ''
      },
      {
        id: 'epic_adventure',
        name: 'Epic Adventure',
        description: 'Grand quests with magical worlds and legendary challenges',
        characteristics: ['Fantasy worlds', 'Magic', 'Epic quests'],
        previewText: 'The ancient crystal pulsed with mysterious energy as she approached the floating castle...',
        ageGroup: '9-12',
        icon: ''
      },
      {
        id: 'choose_your_path',
        name: 'Choose Your Path',
        description: 'Interactive adventures where you make the choices that shape the story',
        characteristics: ['Interactive', 'Multiple endings', 'Your choices matter'],
        previewText: 'You stand at the crossroads. The left path leads to the dark forest, the right to the shining mountains. What do you choose?',
        ageGroup: '9-12',
        icon: ''
      }
    ]
  } else {
    return [
      {
        id: 'dr_seuss',
        name: 'Whimsical Rhyme',
        description: 'Playful, bouncing rhymes with silly words and joyful rhythm',
        characteristics: ['Rhyming', 'Playful', 'Easy to read aloud'],
        previewText: 'Oh my stars! said the Cat, This is where the fun\'s at! With a BUMP and a THUMP and a hop-skippy-jump!',
        ageGroup: '6-8',
        icon: ''
      },
      {
        id: 'eric_carle',
        name: 'Simple & Sweet',
        description: 'Clear, gentle stories with repetitive patterns and learning elements',
        characteristics: ['Simple language', 'Learning focused', 'Repetitive patterns'],
        previewText: 'On Monday, the little caterpillar ate through one red apple. On Tuesday, he ate through two pears...',
        ageGroup: '6-8',
        icon: ''
      },
      {
        id: 'maurice_sendak',
        name: 'Wild Adventure',
        description: 'Imaginative tales that explore emotions and magical journeys',
        characteristics: ['Emotional depth', 'Wild imagination', 'Adventure'],
        previewText: 'That very night in Max\'s room a forest grew and grew until his ceiling hung with vines...',
        ageGroup: '6-8',
        icon: ''
      },
      {
        id: 'roald_dahl',
        name: 'Clever & Fun',
        description: 'Witty stories with clever characters and delightful surprises',
        characteristics: ['Witty', 'Clever characters', 'Surprising twists'],
        previewText: 'Charlie could see the chocolate waterfall cascading down, and he could smell the sugar and vanilla...',
        ageGroup: '6-8',
        icon: ''
      }
    ]
  }
}

export default function AgeSpecificStoryStyleSelectionRN({ 
  onStyleSelect, 
  onBack, 
  childAge 
}: AgeSpecificStoryStyleSelectionRNProps) {
  
  const availableStyles = getStoryStylesForAge(childAge)
  const isOlderChild = childAge >= 9 && childAge <= 12
  
  const handleStyleSelect = (styleId: StoryStyleType) => {
    // Go directly to art selection instead of preview
    onStyleSelect(styleId)
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
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
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
            {isOlderChild ? 'Choose Your Writing Adventure' : 'Pick Your Story Style'}
          </Text>
         
        </View>

        {/* Style Selection Grid */}
        <View style={{ gap: 16 }}>
          {availableStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              onPress={() => handleStyleSelect(style.id)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5
              }}
            >
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: 8,
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 4
                }}>
                  {style.name}
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 22,
                  textShadowColor: 'rgba(0, 0, 0, 0.7)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3
                }}>
                  {style.description}
                </Text>
              </View>

              {/* Characteristics */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {style.characteristics.map((char, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.3)',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '500',
                      textShadowColor: 'rgba(0, 0, 0, 0.8)',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 2
                    }}>
                      {char}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Select Button Indicator */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 12
              }}>
                <Text style={{
                  color: 'rgba(59, 130, 246, 0.9)',
                  fontSize: 17,
                  fontWeight: '500',
                  textShadowColor: 'rgba(0, 0, 0, 0.7)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3
                }}>
                  Select This Style
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color="rgba(59, 130, 246, 0.9)"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        </ScrollView>
        
        {/* Back Button */}
        <View style={{
          padding: 24,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <TouchableOpacity
            onPress={onBack}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: 16,
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
        </View>
      </BlurView>
    </View>
  )
}
