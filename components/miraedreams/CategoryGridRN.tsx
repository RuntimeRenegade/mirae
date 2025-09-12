import { View, Text, Dimensions, Animated, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { AppText, AppHeading1 } from '../AppText';
import { useFadeInAnimation, useStaggeredAnimation } from '../../hooks/useGlassAnimations';

interface StoryElement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: string;
}

interface StoryElementCategory {
  category: string;
  category_display_name: string;
  category_description: string;
  category_icon_url: string;
  elements: StoryElement[];
}

interface CategoryGridProps {
  categories: StoryElementCategory[];
  onCategorySelect: (category: StoryElementCategory) => void;
  selectedCategory?: StoryElementCategory | null;
  title: string;
  subtitle: string;
}

export default function CategoryGridRN({ 
  categories, 
  onCategorySelect, 
  selectedCategory,
  title,
  subtitle 
}: CategoryGridProps) {
  const { width: screenWidth } = Dimensions.get('window');
  
  // Determine if we're on a tablet
  const isTablet = screenWidth >= 768;

  // Animations
  const headerFadeAnim = useFadeInAnimation(0);
  const categoryAnimations = useStaggeredAnimation(categories, 200);

  const getGridConfig = () => {
    if (isTablet) {
      return {
        columns: 3,
        cardWidth: (screenWidth - 80) / 3,
        gap: 16
      };
    }
    return {
      columns: 2,
      cardWidth: (screenWidth - 60) / 2,
      gap: 12
    };
  };

  const gridConfig = getGridConfig();

  const renderCategoryCard = (category: StoryElementCategory, index: number) => {
    const isSelected = selectedCategory?.category === category.category;
    const cardStyle = isSelected 
      ? { ...styles.categoryCard, ...styles.selectedCategoryCard }
      : styles.categoryCard;

    return (
      <Animated.View
        key={category.category}
        style={{
          width: gridConfig.cardWidth,
          marginBottom: gridConfig.gap,
          opacity: categoryAnimations[index]
        }}
      >
        <TouchableOpacity
          onPress={() => onCategorySelect(category)}
          activeOpacity={0.8}
        >
          <GlassCard
            variant={isSelected ? "diamond" : "ultraClear"}
            blurIntensity="heavy"
            style={cardStyle}
          >
            {/* Selection indicator */}
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedIndicatorText}>✓</Text>
              </View>
            )}

            {/* Category Icons - Display across the top */}
            <View style={styles.categoryIconsContainer}>
              {category.elements.length <= 1 ? (
                // Single icon for categories with one element
                <View style={styles.singleIconContainer}>
                  <Image 
                    source={{ uri: category.category_icon_url || category.elements[0]?.icon_url || '' }} 
                    style={styles.singleIcon}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                // Display up to 4 icons across the top
                <View style={styles.multipleIconsContainer}>
                  {category.elements.slice(0, 4).map((element) => (
                    <View key={element.id} style={styles.multipleIconWrapper}>
                      <Image 
                        source={{ uri: element.icon_url }} 
                        style={styles.multipleIcon}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            {/* Category Info */}
            <View style={styles.categoryInfo}>
              {/* Category Name */}
              <AppText style={styles.categoryName}>
                {category.category_display_name}
              </AppText>
              
              {/* Category Description */}
              <AppText style={styles.categoryDescription} numberOfLines={3}>
                {category.category_description}
              </AppText>
              
              {/* Element Count */}
              <View style={styles.elementCount}>
                <AppText style={styles.elementCountText}>
                  {category.elements.length} options
                </AppText>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[styles.headerContainer, { opacity: headerFadeAnim }]}
      >
        <AppHeading1 style={styles.headerTitle}>
          {title}
        </AppHeading1>
        <AppText style={styles.headerSubtitle}>
          {subtitle}
        </AppText>
      </Animated.View>

      {/* Categories Grid */}
      <View style={styles.gridContainer}>
        <View 
          style={[styles.gridRow, { gap: gridConfig.gap }]}
        >
          {categories.map((category, index) => renderCategoryCard(category, index))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  gridContainer: {
    paddingHorizontal: 24,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    padding: 20,
    height: 200,
    position: 'relative',
  },
  selectedCategoryCard: {
    transform: [{ scale: 1.03 }],
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectedIndicatorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryIconsContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleIcon: {
    width: 40,
    height: 40,
    tintColor: '#ffffff',
  },
  multipleIconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '100%',
  },
  multipleIconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multipleIcon: {
    width: 30,
    height: 30,
    tintColor: '#ffffff',
  },
  categoryInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
    flex: 1,
    marginBottom: 12,
  },
  elementCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  elementCountText: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.6,
    fontWeight: '500',
  },
});
