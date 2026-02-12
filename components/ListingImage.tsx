import React, { useState } from 'react';
import { View, Image, ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import { getImageUrl } from '@/lib/api';

const LOGO_SOURCE: ImageSourcePropType = require('@/assets/images/Nepali_homestays_without_bg.png');

type ListingImageProps = {
  /** Optional image URL (listing image_urls item or similar). When missing or on error, logo is shown. */
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

/**
 * Renders a listing image with logo fallback when uri is missing or fails to load.
 * Use anywhere a listing/homestay image is displayed.
 */
export function ListingImage({ uri, style, resizeMode = 'cover' }: ListingImageProps) {
  const [error, setError] = useState(false);
  const resolvedUri = uri ? getImageUrl(uri) : null;
  const showLogo = !resolvedUri || error;

  if (showLogo) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F233E' }]}>
        <Image
          source={LOGO_SOURCE}
          style={[{ width: '60%', height: '60%', maxWidth: 120, maxHeight: 90 }]}
          resizeMode="contain"
          accessibilityLabel="Nepali Homestays logo"
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setError(true)}
    />
  );
}

export { LOGO_SOURCE };
