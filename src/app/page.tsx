import { InputLabel } from "@/components/InputLabel";

export default function Home() {
  return (    
    <div>
      <div className="grid grid-cols-12">
        <div className="col-span-12 bg-blue-500 rounded-lg">
          <InputLabel
            type = "text"
            label = "Nome"
            name = "nome"
          />
        </div>      
      </div>
    </div>
  );
}
