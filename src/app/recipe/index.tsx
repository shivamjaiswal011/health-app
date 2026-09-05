import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { newId } from '@/db/id';
import { recipeSummariesQuery } from '@/features/recipes/queries';
import { createRecipe } from '@/features/recipes/repository';
import { EmptyState } from '@/ui/empty-state';
import { ListRow } from '@/ui/list-row';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

const DEFAULT_SERVINGS = 1;

function beginNewRecipe() {
  const id = newId();
  createRecipe({ id, name: 'New Recipe', servings: DEFAULT_SERVINGS })
    .then(() => router.push(`/recipe/${id}`))
    .catch((cause) => announceFailure('Creating the recipe', cause));
}

type RecipeRowProps = {
  id: string;
  name: string;
  servings: number;
  totalKcal: number | null;
};

function RecipeRow({ id, name, servings, totalKcal }: RecipeRowProps) {
  const perServing = Math.round((totalKcal ?? 0) / Math.max(1, servings));

  return (
    <ListRow
      title={name}
      detail={`${servings} serving${servings === 1 ? '' : 's'} · ${perServing} kcal each`}
      onPress={() => router.push(`/recipe/${id}`)}
    />
  );
}

export default function RecipesScreen() {
  const recipes = useLiveQuery(recipeSummariesQuery());

  return (
    <Screen>
      <ScreenHeader
        left={{ label: 'Back', onPress: () => router.back(), tone: 'muted' }}
        right={{ label: 'New recipe', onPress: beginNewRecipe }}
      />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Recipes</Text>
      <ScrollView contentContainerClassName="px-5 pb-10">
        {recipes.data.length === 0 ? (
          <EmptyState
            title="No recipes yet"
            message="Build a meal once from its ingredients, then log it in one tap whenever you eat it."
            action={{ label: 'New recipe', onPress: beginNewRecipe }}
          />
        ) : (
          recipes.data.map((recipe) => <RecipeRow key={recipe.id} {...recipe} />)
        )}
      </ScrollView>
    </Screen>
  );
}
