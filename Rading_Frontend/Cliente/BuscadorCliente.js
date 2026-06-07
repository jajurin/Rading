import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import TrabajoActivoCliente from './TrabajoActivoCliente';
import Search from '../Trabajador/Search';

const PROFILES = [
  {
    id: '1',
    name: 'Alan',
    jobCount: 100,
    rating: 5.0,
    bio: 'Nutricionista, puedo contactarme manera presencial.',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  {
    id: '2',
    name: 'Alan',
    jobCount: 100,
    rating: 5.0,
    bio: 'Nutricionista, puedo contactarme manera presencial.',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  {
    id: '3',
    name: 'Alan',
    jobCount: 100,
    rating: 5.0,
    bio: 'Nutricionista, puedo contactarme manera presencial.',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  {
    id: '4',
    name: 'Alan',
    jobCount: 100,
    rating: 5.0,
    bio: 'Nutricionista, puedo contactarme manera presencial.',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
];

const RatingBadge = ({ rating }) => (
  <View style={styles.ratingBadge}>
    <Text style={styles.ratingText}>{rating.toFixed(2)}</Text>
    <Text style={styles.ratingStar}>★</Text>
  </View>
);

const ChatIcon = () => (
  <View style={styles.chatIcon}>
    <View style={styles.chatBubble}>
      <View style={styles.dotsRow}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
    <View style={styles.chatTail} />
  </View>
);

const ProfileCard = ({ profile, onPressAvatar, onPressChat }) => (
  <View style={styles.card}>
    <TouchableOpacity
      style={styles.avatarWrapper}
      onPress={() => onPressAvatar(profile)}
      activeOpacity={0.8}
      accessibilityLabel={`Ver perfil de ${profile.name}`}
    >
      <Image source={{ uri: profile.avatar }} style={styles.avatar} />
    </TouchableOpacity>

    <View style={styles.cardBody}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{profile.name}</Text>
        <Text style={styles.cardJobs}>n.° Trabajos: {profile.jobCount}</Text>
        <RatingBadge rating={profile.rating} />
      </View>
      <Text style={styles.cardLabel}>Sobre Mí</Text>
      <Text style={styles.cardBio} numberOfLines={2}>
        {profile.bio}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.chatButton}
      onPress={() => onPressChat(profile)}
      activeOpacity={0.8}
      accessibilityLabel={`Chatear con ${profile.name}`}
    >
      <ChatIcon />
    </TouchableOpacity>
  </View>
);

export default function ProfilesScreen({
  onPressAvatar = () => {},
  onPressChat = () => {},
  onPressMore = () => {},
}) {
  return (
    <SafeAreaView style={styles.safe}>

   <Search/>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Perfiles</Text>

        {PROFILES.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onPressAvatar={onPressAvatar}
            onPressChat={onPressChat}
          />
        ))}

        <TouchableOpacity onPress={onPressMore} style={styles.moreBtn}>
          <Text style={styles.moreText}>Más...</Text>
        </TouchableOpacity>

        
      </ScrollView>
              <TrabajoActivoCliente/>

    </SafeAreaView>
  );
}

const BLUE_DARK = '#0a0f3c';
const BLUE_CARD = '#1e35b5';
const BLUE_LIGHT = '#2a4fd6';
const WHITE = '#ffffff';
const GOLD = '#ffd700';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8a8a8a',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIconText: {
  
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    color: '#000000',
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterBtn: {
    padding: 4,
  },
  filterIcon: {
    color: '#000000',
    fontSize: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    color: BLUE_LIGHT,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_CARD,
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarWrapper: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: BLUE_LIGHT,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  cardName: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
  cardJobs: {
    color: '#c0ceff',
    fontSize: 11,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0f3c',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  ratingText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '600',
  },
  ratingStar: {
    color: GOLD,
    fontSize: 11,
  },
  cardLabel: {
    color: '#c0ceff',
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  cardBio: {
    color: '#dce4ff',
    fontSize: 12,
    lineHeight: 16,
  },
  chatButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBubble: {
    width: 28,
    height: 22,
    backgroundColor: WHITE,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BLUE_CARD,
  },
  chatTail: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderTopColor: WHITE,
    borderRightColor: 'transparent',
  },
  moreBtn: {
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  moreText: {
    color: WHITE,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});