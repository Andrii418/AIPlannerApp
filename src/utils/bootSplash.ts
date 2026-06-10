import RNBootSplash from 'react-native-bootsplash';

let isHidden = false;

export const hideBootSplash = async () => {
  if (isHidden) return;
  isHidden = true;
  await RNBootSplash.hide({ fade: true });
};
