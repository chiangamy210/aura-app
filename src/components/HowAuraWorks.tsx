import { useTranslation } from 'react-i18next';

function HowAuraWorks() {
  const { t } = useTranslation();

  return (
    <section className="how-aura-works">
      <h2>{t('how_aura_works_title')}</h2>
      <p>{t('how_aura_works_intro_new')}</p>
      <p>{t('how_aura_works_process_intro')}</p>
      <h4>{t('how_aura_works_synchronicity_title')}</h4>
      <p>{t('how_aura_works_synchronicity_text')}</p>
      <h4>{t('how_aura_works_universal_wisdom_title')}</h4>
      <p>{t('how_aura_works_universal_wisdom_text')}</p>
      <h4>{t('how_aura_works_quantum_connection_title')}</h4>
      <p>{t('how_aura_works_quantum_connection_intro')}</p>
      <h5>{t('how_aura_works_observer_effect_title')}</h5>
      <p>{t('how_aura_works_observer_effect_text')}</p>
      <h5>{t('how_aura_works_entanglement_title')}</h5>
      <p>{t('how_aura_works_entanglement_text')}</p>
      <p>{t('how_aura_works_conclusion_new')}</p>
    </section>
  );
}

export default HowAuraWorks;
