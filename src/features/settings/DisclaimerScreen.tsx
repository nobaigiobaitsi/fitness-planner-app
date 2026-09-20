import { StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { colors, radii, spacing, typography } from '@/theme/tokens';

const sections = [
  {
    title: 'Purpose of the app',
    text: `FitPlanner provides general fitness information, exercise demonstrations, and tools for creating and following workout plans.

FitPlanner is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information in the app is not medical advice and is not a substitute for diagnosis, treatment, rehabilitation, or advice from a doctor, physiotherapist, or other licensed healthcare professional.`,
  },
  {
    title: 'Before you exercise',
    text: `Consult a healthcare professional before beginning or changing an exercise program if you have an injury or medical condition, have recently undergone surgery, are pregnant or postpartum, take medication that may affect exercise, have been inactive for an extended period, or are unsure whether an exercise is appropriate for you.`,
  },
  {
    title: 'Exercise safely',
    text: `Exercise involves a risk of injury. Use appropriate resistance and equipment, exercise in a safe environment, and remain within your abilities.

Consider asking a qualified fitness professional to assess your technique, equipment, and training load, particularly when performing an unfamiliar exercise.`,
  },
  {
    title: 'When to stop',
    text: `Stop exercising immediately if you experience sharp or unusual pain, chest pain, dizziness, fainting, unusual shortness of breath, or another concerning symptom.

Seek appropriate medical assistance. In an emergency, contact your local emergency services — 112 in Greece and elsewhere in the European Union.`,
  },
  {
    title: 'Individual suitability',
    text: `The exercises, images, tips, and workout plans available through FitPlanner are general in nature. They may not account for your medical history, physical condition, experience, mobility, equipment, or training environment.

Some content may be prepared or reviewed by a qualified fitness professional. This does not make it individualized medical advice or medical clearance. A workout created for another person may not be suitable for you.`,
  },
  {
    title: 'Users under 18',
    text: `Users under 18 should use the app only with permission from a parent or guardian and with appropriate professional supervision.`,
  },
  {
    title: 'Results and responsibility',
    text: `Individual results vary and are not guaranteed. You are responsible for using the app within your abilities and following any advice provided by your healthcare or fitness professionals.

Nothing in this notice excludes or limits any right or liability that cannot legally be excluded or limited under applicable law.`,
  },
];

export default function DisclaimerScreen() {
  return (
    <Screen>
      <BackHeader title="Legal & safety" />

      <Text style={styles.title}>Health & Exercise Disclaimer</Text>
      <Text style={styles.updated}>Last updated: 20 September 2026</Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Important safety information</Text>
        <Text style={styles.noticeText}>
          FitPlanner is a general fitness planning tool. It should not replace
          professional medical advice or appropriate supervision.
        </Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionText}>{section.text}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typography.title,
    lineHeight: 31,
    fontWeight: '800',
  },
  updated: {
    color: colors.inkMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  notice: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: '#FFF4E3',
  },
  noticeTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  noticeText: {
    color: colors.ink,
    fontSize: typography.label,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  sectionText: {
    color: colors.inkMuted,
    fontSize: typography.body,
    lineHeight: 25,
  },
});