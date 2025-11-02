import AddPlayerForm from '../AddPlayerForm';

export default function AddPlayerFormExample() {
  return (
    <div className="p-6 max-w-3xl">
      <AddPlayerForm
        onAdd={(name, region) => console.log('Add player:', name, region)}
        isLoading={false}
      />
    </div>
  );
}
