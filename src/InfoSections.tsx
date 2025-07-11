import React from 'react';
import { useTranslation } from 'react-i18next';

interface InfoSectionsProps {
  activeTab: string | null;
}

const InfoSections: React.FC<InfoSectionsProps> = ({ activeTab }) => {
  const { t } = useTranslation();

  if (!activeTab) {
    return null;
  }

  return (
    <section className="info-section">
      {activeTab === 'howAuraWorks' && (
        <div>
          <h2>{t('how_aura_works_title')}</h2>
          <p>{t('how_aura_works_intro')}</p>
          <p>{t('how_aura_works_quantum_intro')}</p>
          <h4>{t('how_aura_works_observer_effect_title')}</h4>
          <p>{t('how_aura_works_observer_effect_text')}</p>
          <h4>{t('how_aura_works_entanglement_title')}</h4>
          <p>{t('how_aura_works_entanglement_text')}</p>
          <p>{t('how_aura_works_conclusion')}</p>
        </div>
      )}
      {activeTab === 'howToAsk' && (
        <div>
          <h2>{t('how_to_ask_title')}</h2>
          <p>{t('how_to_ask_intro')}</p>
          <h4>{t('how_to_ask_step1_title')}</h4>
          <p>{t('how_to_ask_step1_text')}</p>
          <h4>{t('how_to_ask_step2_title')}</h4>
          <p>{t('how_to_ask_step2_text')}</p>
          <h4>{t('how_to_ask_step3_title')}</h4>
          <p>{t('how_to_ask_step3_text')}</p>
          <h4>{t('how_to_ask_step4_title')}</h4>
          <p>{t('how_to_ask_step4_text')}</p>
          <h4>{t('how_to_ask_examples_title')}</h4>
          <p>{t('how_to_ask_examples_intro')}</p>
          <ul>
            <li>{t('how_to_ask_example1')}</li>
            <li>{t('how_to_ask_example2')}</li>
            <li>{t('how_to_ask_example3')}</li>
          </ul>
        </div>
      )}
    </section>
  );
};

export default InfoSections;
