import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../../theme/fonts';

const COIN_PACKAGES = [
  { coins: 50, price: 1500, popular: false },
  { coins: 150, price: 4000, popular: true },
  { coins: 500, price: 12000, popular: false },
  { coins: 1000, price: 20000, popular: false },
  { coins: 2500, price: 45000, popular: false },
];

export const CoinPurchaseSheet = React.forwardRef((props, ref) => {
  const snapPoints = ['70%'];

  const handlePurchase = (coins: number, price: number) => {
    // Handle purchase logic
    console.log(`Purchasing ${coins} coins for ₦${price}`);
  };

  return (
    <BottomSheetModal ref={ref} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Buy Whizpar Coins</Text>
          <Text style={styles.subtitle}>Select a coin package</Text>
        </View>

        <View style={styles.packages}>
          {COIN_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.coins}
              style={[styles.package, pkg.popular && styles.popularPackage]}
              onPress={() => handlePurchase(pkg.coins, pkg.price)}
            >
              <LinearGradient
                colors={pkg.popular ? ['#7C4DFF', '#FF4D9C'] : ['rgba(124, 77, 255, 0.1)', 'rgba(124, 77, 255, 0.05)']}
                style={styles.packageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                
                <View style={styles.coinAmount}>
                  <Icon name="cash" size={24} color={pkg.popular ? '#FFFFFF' : '#FFD700'} />
                  <Text style={[styles.coinText, pkg.popular && styles.popularCoinText]}>
                    {pkg.coins} Coins
                  </Text>
                </View>

                <Text style={[styles.priceText, pkg.popular && styles.popularPriceText]}>
                  ₦{pkg.price.toLocaleString()}
                </Text>

                <Text style={[styles.perCoinText, pkg.popular && styles.popularPerCoinText]}>
                  ₦{(pkg.price / pkg.coins).toFixed(2)} per coin
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.secureText}>
          <Icon name="shield-check" size={16} color="#7C4DFF" /> Secure Payment
        </Text>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  packages: {
    gap: 16,
  },
  package: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  popularPackage: {
    transform: [{ scale: 1.02 }],
    elevation: 8,
  },
  packageGradient: {
    padding: 16,
    borderRadius: 16,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  coinAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  coinText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#FFD700',
  },
  popularCoinText: {
    color: '#FFFFFF',
  },
  priceText: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  popularPriceText: {
    color: '#FFFFFF',
  },
  perCoinText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  popularPerCoinText: {
    color: 'rgba(255,255,255,0.7)',
  },
  secureText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#7C4DFF',
    textAlign: 'center',
    marginTop: 24,
  },
}); 