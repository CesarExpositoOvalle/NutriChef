export default function MyRecipeCard({ recipe, onClick }) {
  return (
    <div className="my-dish-card" onClick={onClick}>
      
      
      <div className="my-dish-image">
        {recipe.image && <img src={recipe.image} alt={recipe.title} />}
      </div>

      
      <div className="my-dish-footer">
        {recipe.title}
      </div>

      <div className="my-dish-hover">
        <div className="my-icon">
          🔥
          <span>{recipe.calories}</span>
        </div>

        <div className="my-icon">
          🍗
          <span>{recipe.protein}</span>
        </div>

        <div className="my-icon">
          🧈
          <span>{recipe.fats}</span>
        </div>

        <div className="my-icon">
          🍠
          <span>{recipe.carbs}</span>
        </div>
      </div>

    </div>
  );
}
