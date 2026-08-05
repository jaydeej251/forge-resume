Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :resumes, only: [ :create, :show, :update ], param: :session_id do
        resource :photo, only: [ :create, :destroy ]
        resources :messages, only: [ :create ] do
          collection do
            post :stream
          end
        end
      end
    end
  end
end
