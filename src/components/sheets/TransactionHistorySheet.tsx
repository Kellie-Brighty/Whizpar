import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../../theme/fonts';

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'purchase', coins: 150, amount: 4000, date: '2024-03-15' },
  { id: '2', type: 'spent', coins: 500, feature: 'Custom Avatar', date: '2024-03-14' },
  { id: '3', type: 'purchase', coins: 1000, amount: 20000, date: '2024-03-10' },
  { id: '4', type: 'spent', coins: 1000, feature: 'Public Nudge', date: '2024-03-08' },
];

export const TransactionHistorySheet = React.forwardRef((props, ref) => {
  const snapPoints = ['70%'];

  const renderTransaction = ({ item }) => (
    <View style={styles.transaction}>
      <View style={styles.transactionIcon}>
        <Icon 
          name={item.type === 'purchase' ? 'cash-plus' : 'cash-minus'} 
          size={24} 
          color={item.type === 'purchase' ? '#4CAF50' : '#FF4D9C'} 
        />
      </View>
      
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>
          {item.type === 'purchase' ? 'Purchased Coins' : `Spent on ${item.feature}`}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'purchase' ? '#4CAF50' : '#FF4D9C' }
        ]}>
          {item.type === 'purchase' ? '+' : '-'}{item.coins}
        </Text>
        {item.amount && (
          <Text style={styles.fiatAmount}>₦{item.amount.toLocaleString()}</Text>
        )}
      </View>
    </View>
  );

  return (
    <BottomSheetModal ref={ref} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction History</Text>
        </View>

        <FlatList
          data={MOCK_TRANSACTIONS}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDate: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  fiatAmount: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
}); 