import Ionicons from '@expo/vector-icons/Ionicons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { composeServing } from '@/domain/nutrition/recipe';
import { recipeItemsQuery, recipeQuery, type RecipeItemRow } from '@/features/recipes/queries';
import {
  deleteRecipe,
  removeRecipeItem,
  renameRecipe,
  setServings,
} from '@/features/recipes/repository';
import { announceFailure } from '@/ui/failure';
import { NumberInput } from '@/ui/number-input';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';
import { useAutosavedText } from '@/ui/use-autosaved-text';

const MINIMUM_SERVINGS = 1;

function confirmDelete(recipeId: string) {
  Alert.alert('Delete recipe?', 'Meals already logged from it are kept.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        deleteRecipe(recipeId)
          .then(() => router.back())
          .catch((cause) => announceFailure('Deleting the recipe', cause));
      },
    },
  ]);
}

function RecipeNameField({ recipeId, name }: { recipeId: string; name: string }) {
  const field = useAutosavedText(name, (next) => {
    renameRecipe(recipeId, next.trim() || 'Recipe').catch((cause) =>
      announceFailure('Renaming the recipe', cause),
    );
  });

  return (
    <TextInput
      value={field.value}
      onChangeText={field.onChangeText}
      placeholder="Recipe name"
      autoCorrect={false}
      className="mx-5 h-12 rounded-xl bg-surface-sunken px-4 text-lg font-semibold text-content"
    />
  );
}

function IngredientRow({ item }: { item: RecipeItemRow }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-line px-5 py-3">
      <View className="flex-1">
        <Text className="text-sm text-content" numberOfLines={1}>
          {item.foodName}
        </Text>
        <Text className="mt-0.5 text-xs text-content-faint">
          {Math.round(item.grams)} g · {Math.round(item.kcal)} kcal
        </Text>
      </View>
      <Pressable
        onPress={() =>
          removeRecipeItem(item.id).catch((cause) =>
            announceFailure('Removing the ingredient', cause),
          )
        }
        accessibilityLabel={`Remove ${item.foodName}`}
        className="p-1 active:opacity-60">
        <Ionicons name="close" size={16} color="rgb(113,113,122)" />
      </Pressable>
    </View>
  );
}

function ServingsRow({ recipeId, servings }: { recipeId: string; servings: number }) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Text className="text-base text-content">Servings</Text>
      <View className="w-24">
        <NumberInput
          defaultValue={servings}
          onChangeValue={(next) =>
            setServings(recipeId, Math.max(MINIMUM_SERVINGS, next ?? MINIMUM_SERVINGS)).catch(
              (cause) => announceFailure('Setting servings', cause),
            )
          }
          placeholder="1"
        />
      </View>
    </View>
  );
}

function PerServingCard({ composed }: { composed: ReturnType<typeof composeServing> }) {
  return (
    <View className="mx-5 mb-4 rounded-2xl border border-line bg-surface-raised p-4">
      <Text className="text-xs font-semibold uppercase text-content-faint">Per serving</Text>
      <Text className="mt-1 text-2xl font-bold text-content">
        {Math.round(composed.perServing.kcal)} kcal
      </Text>
      <Text className="mt-0.5 text-xs text-content-muted">
        {Math.round(composed.gramsPerServing)} g · P{composed.perServing.protein} · C
        {composed.perServing.carbs} · F{composed.perServing.fat}
      </Text>
    </View>
  );
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useLiveQuery(recipeQuery(id));
  const items = useLiveQuery(recipeItemsQuery(id));
  const loaded = recipe.data[0];
  const servings = loaded?.servings ?? MINIMUM_SERVINGS;
  const composed = composeServing(items.data, servings);

  return (
    <Screen>
      <ScreenHeader right={{ label: 'Done', onPress: () => router.back() }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">{loaded?.name ?? 'Recipe'}</Text>
      <ScrollView contentContainerClassName="pb-8" keyboardShouldPersistTaps="handled">
        {loaded ? <RecipeNameField recipeId={id} name={loaded.name} /> : null}

        <ServingsRow recipeId={id} servings={servings} />
        <PerServingCard composed={composed} />

        {items.data.map((item) => (
          <IngredientRow key={item.id} item={item} />
        ))}

        <Link href={{ pathname: '/recipe/add-ingredient', params: { recipeId: id } }} asChild>
          <Pressable className="mx-5 mt-4 items-center rounded-2xl border border-dashed border-line py-4 active:opacity-60">
            <Text className="text-sm font-semibold text-accent">+ Add ingredient</Text>
          </Pressable>
        </Link>

        <Pressable onPress={() => confirmDelete(id)} className="items-center py-4">
          <Text className="text-sm font-semibold text-danger">Delete recipe</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
