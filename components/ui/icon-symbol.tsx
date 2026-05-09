import AntDesign from '@expo/vector-icons/AntDesign';
import Foundation from '@expo/vector-icons/Foundation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  if (name === 'house.fill') return <MaterialIcons name="home" size={size} color={color} style={style} />;
  if (name === 'book.fill') return <AntDesign name="book" size={size} color={color} style={style} />;
  if (name === 'doc.text.fill') return <AntDesign name="history" size={size} color={color} style={style} />;
  if (name === 'chart.bar.fill') return <Foundation name="results" size={size} color={color} style={style} />;

  // Default fallback
  return <MaterialIcons name="home" size={size} color={color} style={style} />;
}