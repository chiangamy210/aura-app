import { useTranslation } from 'react-i18next';

function HowAuraWorks() {
  const { t } = useTranslation();

  return (
    <section className="how-aura-works">
      <h2>{t('how_aura_works_title')}</h2>
      <p>{t('how_aura_works_intro')}</p>
      <p>{t('how_aura_works_quantum_intro')}</p>
      <h4>{t('how_aura_works_observer_effect_title')}</h4>
      <p>{t('how_aura_works_observer_effect_text')}</p>
      <h4>{t('how_aura_works_entanglement_title')}</h4>
      <p>{t('how_aura_works_entanglement_text')}</p>
      <p>{t('how_aura_works_conclusion')}</p>
    </section>
  );
}

export default HowAuraWorks;
