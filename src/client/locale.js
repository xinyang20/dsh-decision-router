const CHINESE_LOCALE = 'zh-CN';

/** Fill the host's untranslated model label through its supported language-pack API. */
export function installChineseLocale(ctx) {
  return ctx.effect(() => {
    const locale = ctx.locale;
    let removeDictionary = () => {};
    let removeLanguage;
    let unsubscribe = () => {};
    try {
      try {
        removeDictionary = locale.register('model', CHINESE_LOCALE, { 'effort.providerDefault': '默认' });
      } catch (error) {
        // Another language pack owns this dictionary; leave that owner's text intact.
        if (error.message !== `locale namespace "model" already has locale "${CHINESE_LOCALE}"`) throw error;
      }
      if (!locale.getLocale().locales.some(language => language.id.toLowerCase() === CHINESE_LOCALE.toLowerCase())) {
        removeLanguage = locale.addLanguage({ id: CHINESE_LOCALE, label: '简体中文', fallback: 'zh' });
      }
      const useCompleteChinese = () => {
        // Preserve English and other user-selected languages. This also handles
        // a Chinese preference arriving asynchronously from the host settings.
        if (locale.getLocale().active === 'zh') locale.setLocale(CHINESE_LOCALE);
      };
      unsubscribe = locale.subscribe(useCompleteChinese);
      useCompleteChinese();
    } catch (error) {
      unsubscribe();
      removeLanguage?.();
      removeDictionary();
      throw error;
    }
    return () => {
      unsubscribe();
      // Removing this optional language should retain the user's Chinese UI.
      if (removeLanguage && locale.getLocale().active.toLowerCase() === CHINESE_LOCALE.toLowerCase()) locale.setLocale('zh');
      removeLanguage?.();
      removeDictionary();
    };
  });
}
